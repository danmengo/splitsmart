import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowUpRight, ArrowRight, Users, Receipt, Check, Coffee, Home, Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Brand from '@/components/Brand'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')
  return <div className="min-h-screen bg-background">
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-7 sm:px-10">
      <Brand /><nav aria-label="Account navigation" className="flex items-center gap-2"><Button asChild variant="ghost"><Link href="/login">Sign in</Link></Button><Button asChild className="hidden sm:inline-flex"><Link href="/signup">Get started <ArrowUpRight /></Link></Button></nav>
    </header>
    <main>
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-12 sm:px-10 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-800"><span className="size-2 rounded-full bg-teal-600" /> Shared moments. Simple money.</p>
          <h1 className="max-w-xl text-5xl font-medium leading-[1.08] tracking-[-0.055em] text-teal-950 sm:text-7xl">Split the bill.<br />Keep the <span className="text-teal-600">good vibes.</span></h1>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-muted-foreground">Dinner with friends. A place together. That trip you finally booked. Make shared expenses the easy part.</p>
          <div className="mt-9 flex flex-wrap items-center gap-5"><Button asChild size="lg"><Link href="/signup">Start splitting <ArrowUpRight /></Link></Button><Link href="#how-it-works" className="text-sm font-medium text-teal-900 hover:underline">See how it works <span aria-hidden="true">↓</span></Link></div>
          <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground"><Check size={14} /> Free to use. No credit card needed.</p>
        </div>
        <div className="relative rounded-[2rem] bg-[#e5eddf] p-5 sm:p-9">
          <div className="mb-5 flex items-center justify-between text-xs font-medium text-teal-800"><span>A little clarity goes a long way.</span><span>Example group</span></div>
          <div className="rounded-2xl border border-white bg-white p-6 shadow-[0_16px_48px_-24px_#134e4a60] sm:p-7">
            <div className="flex items-center gap-3"><span className="rounded-xl bg-teal-50 p-3 text-teal-800"><Plane size={23} /></span><div><h2 className="font-semibold text-teal-950">The weekend crew</h2><p className="mt-0.5 text-xs text-muted-foreground">4 friends · 1 great trip</p></div></div>
            <div className="my-7 rounded-xl bg-teal-950 p-5 text-white"><p className="text-xs text-teal-100">Total shared expenses</p><p className="mt-2 text-4xl font-medium tracking-tight">$320.00</p><div className="mt-4 flex items-center justify-between border-t border-white/15 pt-4 text-xs"><span className="text-teal-100">Your share</span><span className="font-medium text-lime-200">$80.00</span></div></div>
            {[{name:'Our cozy stay',amount:'$240.00',icon:Home},{name:'Coffee & catch-ups',amount:'$32.00',icon:Coffee},{name:'Dinner together',amount:'$48.00',icon:Receipt}].map(({name,amount,icon:Icon}) => <div key={name} className="flex items-center gap-3 border-b border-border py-3 last:border-0"><Icon size={17} className="text-teal-700" /><span className="flex-1 text-sm">{name}</span><span className="text-sm font-medium tabular-nums">{amount}</span></div>)}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-lime-200 px-4 py-3 text-sm font-medium text-teal-950"><span className="flex items-center gap-2"><Check size={17} /> Fair shares. Happy friends.</span><span className="text-[10px] uppercase tracking-wider">Example</span></div>
        </div>
      </section>
      <section id="how-it-works" className="mx-auto max-w-7xl border-t border-border px-6 py-16 sm:px-10">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Less admin. More together.</p><h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">A fair split in three simple steps.</h2></div><Link href="/signup" className="inline-flex items-center gap-2 text-sm font-medium text-teal-800">Let’s get started <ArrowRight size={16} /></Link></div>
        <div className="grid gap-5 md:grid-cols-3">{[{n:'01',title:'Bring your people',text:'Create a group for your home, a trip, or whatever brings you together.',icon:Users},{n:'02',title:'Add the little things',text:'Log who paid. Split equally, by percentage, or by a custom amount.',icon:Receipt},{n:'03',title:'Settle up, move on',text:'See exactly who owes what and mark payments when you settle.',icon:Check}].map(({n,title,text,icon:Icon}) => <article key={n} className="rounded-2xl border border-border bg-white p-7"><div className="mb-8 flex items-center justify-between"><Icon size={24} className="text-teal-800" /><span className="font-mono text-xs text-muted-foreground">{n}</span></div><h3 className="text-lg font-semibold tracking-tight">{title}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p></article>)}</div>
      </section>
    </main>
    <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-t border-border px-6 py-8 text-xs text-muted-foreground sm:px-10"><span>SplitSmart · Better together.</span><span>Shared expenses, without the awkwardness.</span></footer>
  </div>
}
