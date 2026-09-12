const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

// Compile the real TypeScript handlers, injecting only their external services.
function load(file, mocks = {}) {
  const filename = path.resolve(file)
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  const localRequire = name => {
    if (Object.hasOwn(mocks, name)) return mocks[name]
    if (name.startsWith('@/')) return load(`src/${name.slice(2)}.ts`, mocks)
    return require(name)
  }
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports)
  return module.exports
}
const { expenseInput, normalizeSplits } = load('src/lib/expense-input.ts')
const base = { title: 'Dinner', amount: '10.00', splitType: 'equal',
  splits: ['a', 'b', 'c'].map(userId => ({ userId, amount: 10 / 3 })) }
const parse = changes => expenseInput.parse({ ...base, ...changes })

test('equal splits distribute all cents deterministically', () => {
  const splits = normalizeSplits(parse({}), ['a','b','c'])
  assert.deepEqual(splits.map(s => s.amount), [3.34, 3.33, 3.33])
  assert.deepEqual(normalizeSplits(parse({splits: [...base.splits].reverse()}), ['a','b','c']), splits)
})
test('percentage allocation keeps the expense total and ignores browser-calculated amounts', () => {
  const splits = normalizeSplits(parse({amount: '0.01', splitType: 'percentage', splits: [
    {userId:'a',amount:99,percentage:50}, {userId:'b',amount:0,percentage:50},
  ]}), ['a','b'])
  assert.deepEqual(splits.map(s=>s.amount), [.01,0])
})
test('reject invalid totals, amounts, types, and missing fields', () => {
  for (const amount of [-1,0,Infinity,NaN,'','abc','10oops',true,null,1.001]) {
    assert.equal(expenseInput.safeParse({...base,amount}).success,false, String(amount))
  }
  assert.equal(expenseInput.safeParse({...base,title:'  '}).success,false)
  assert.equal(expenseInput.safeParse({...base,splitType:'fake'}).success,false)
  assert.equal(expenseInput.safeParse({...base,splits:[]}).success,false)
  assert.throws(()=>normalizeSplits(parse({splitType:'amount',splits:[{userId:'a',amount:9}]}),['a']), /total/)
  assert.throws(()=>normalizeSplits(parse({splitType:'percentage',splits:[{userId:'a',amount:10,percentage:90}]}),['a']), /100/)
})
test('reject outsiders and duplicate participants', () => {
  assert.throws(()=>normalizeSplits(parse({}),['a','b']), /belong/)
  assert.throws(()=>normalizeSplits(parse({splits:[base.splits[0],base.splits[0]]}),['a']), /once/)
})
test('valid dollar splits remain exact', () => {
  const splits=normalizeSplits(parse({splitType:'amount',splits:[{userId:'a',amount:3.01},{userId:'b',amount:6.99}]}),['a','b'])
  assert.deepEqual(splits.map(s=>s.amount),[3.01,6.99])
})
function services(tx, user = {id:'a'}) {
  return { '@/lib/supabase/server': { createClient: async()=>({auth:{getUser:async()=>({data:{user}})}}) },
    '@/lib/prisma': {prisma: {...tx, $transaction: async fn=>fn(tx)}},
    'next/server': {NextResponse: Response}, }
}
const request = body => new Request('http://localhost/api/test',{method:'POST',body:JSON.stringify(body)})
const params = {params:Promise.resolve({expenseId:'e'})}
for (const role of [null,'member']) test(`invite rejects ${role || 'outsider'} before looking up target email`,async()=>{
  const tx={groupMember:{findUnique:async()=>role ? {role}:null},user:{findUnique:async()=>assert.fail('Unauthorized lookup')}}
  const {POST}=load('src/app/api/groups/invite/route.ts', services(tx))
  assert.equal((await POST(request({groupId:'g',email:'person@example.com'}))).status,403)
})
test('admin invite adds membership and notification',async()=>{
  let notified=false
  const tx={groupMember:{findUnique:async()=>({role:'admin'}),createMany:async()=>({count:1})},
    user:{findUnique:async()=>({id:'b'})},notification:{create:async()=>{notified=true}}}
  const {POST}=load('src/app/api/groups/invite/route.ts',services(tx))
  assert.equal((await POST(request({groupId:'g',email:'person@example.com'}))).status,200)
  assert.equal(notified,true)
})
test('invalid JSON returns 400 rather than an exception',async()=>{
  const {POST}=load('src/app/api/expenses/route.ts',services({}))
  assert.equal((await POST(new Request('http://localhost',{method:'POST',body:'{'}))).status,400)
})
test('expense creation rejects nonmembers before writes',async()=>{
  const {POST}=load('src/app/api/expenses/route.ts',services({groupMember:{findMany:async()=>[{userId:'b'}]}}))
  assert.equal((await POST(request({...base,groupId:'g'}))).status,403)
})
test('expense creation writes normalized splits',async()=>{
  let saved
  const tx={groupMember:{findMany:async()=>['a','b','c'].map(userId=>({userId}))},
    expense:{create:async({data})=>{saved=data;return {id:'e'}}},notification:{createMany:async()=>({count:2})}}
  const {POST}=load('src/app/api/expenses/route.ts',services(tx))
  assert.equal((await POST(request({...base,groupId:'g'}))).status,201)
  assert.deepEqual(saved.splits.create.map(s=>s.amount),[3.34,3.33,3.33])
})
const existing = {id:'e',paidById:'a',group:{members:[{userId:'a'},{userId:'b'}]},splits:[{userId:'b',paid:true,amount:5}]}
test('title-only edit never deletes or recreates settled splits',async()=>{
  let update
  const tx={expense:{findUnique:async()=>existing, update:async args=>{update=args;return {id:'e',...args.data}}},
    expenseSplit:{deleteMany:async()=>assert.fail('Payment history deleted')}}
  const {PUT}=load('src/app/api/expenses/[expenseId]/route.ts',services(tx))
  assert.equal((await PUT(request({title:'Renamed'}),params)).status,200)
  assert.deepEqual(update.data,{title:'Renamed'})
})
test('financial edit on a settled expense returns conflict without writes',async()=>{
  const {PUT}=load('src/app/api/expenses/[expenseId]/route.ts',services({expense:{findUnique:async()=>existing}}))
  assert.equal((await PUT(request(base),params)).status,409)
})
test('nonpayer cannot edit expense',async()=>{
  const {PUT}=load('src/app/api/expenses/[expenseId]/route.ts',services({expense:{findUnique:async()=>existing}},{id:'b'}))
  assert.equal((await PUT(request({title:'No'}),params)).status,403)
})
test('settlement rejects people outside the group',async()=>{
  const {POST}=load('src/app/api/groups/[groupId]/settle/route.ts',services({groupMember:{findMany:async()=>[]}}))
  assert.equal((await POST(request({withUserId:'b'}),{params:Promise.resolve({groupId:'g'})})).status,403)
})
