import Brand from '@/components/Brand'
import { Check, ArrowUpRight } from 'lucide-react'

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return <main className="grid min-h-screen lg:grid-cols-2">
    <section className="relative hidden flex-col justify-between overflow-hidden bg-teal-950 p-12 text-white lg:flex xl:p-16">
      <Brand light />
      <div className="relative z-10 max-w-lg py-16">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-lime-200">Less math. More living.</p>
        <h2 className="text-6xl font-medium leading-[1.08] tracking-[-0.045em]">Great company.<br /><span className="text-lime-200">Even splits.</span></h2>
        <p className="mt-6 max-w-sm text-lg leading-relaxed text-teal-100/80">From the everyday groceries to the unforgettable weekends. Share the costs, enjoy the moments.</p>
        <div className="mt-10 rotate-[-3deg] rounded-2xl bg-white p-6 text-teal-950 shadow-xl">
          <div className="flex items-center justify-between"><span className="text-sm font-medium">Weekend away</span><ArrowUpRight size={18} /></div>
          <div className="mt-5 flex items-end justify-between"><div><p className="text-xs text-muted-foreground">Shared equally · 4 friends</p><p className="mt-1 text-3xl font-semibold tracking-tight">$80.00 <span className="text-sm font-normal text-muted-foreground">each</span></p></div><span className="flex size-10 items-center justify-center rounded-full bg-lime-200"><Check size={20} /></span></div>
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">Example split · simple, fair, sorted.</p>
        </div>
      </div>
      <p className="text-sm text-teal-200/70">A little less awkward. A lot more together.</p>
    </section>
    <section className="flex flex-col bg-background px-6 py-8 sm:px-12">
      <div className="lg:hidden"><Brand /></div>
      <div className="m-auto w-full max-w-sm py-12">{children}</div>
      <p className="text-center text-xs text-muted-foreground">Shared expenses. Clear balances. Better together.</p>
    </section>
  </main>
}
