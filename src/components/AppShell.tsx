'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Bell, LogOut, ArrowUpRight } from 'lucide-react'
import Brand from '@/components/Brand'

const links = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/groups', label: 'Your groups', icon: Users },
  { href: '/notifications', label: 'Activity', icon: Bell },
]

export default function AppShell({ children, unreadCount, name }: { children: React.ReactNode; unreadCount: number; name: string }) {
  const pathname = usePathname()
  const current = links.find(link => pathname.startsWith(link.href))
  return <div className="min-h-screen bg-background">
    <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">Skip to content</a>
    <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-teal-950 p-6 text-white lg:flex">
      <Brand light />
      <p className="mb-4 mt-12 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-200/70">Your workspace</p>
      <nav aria-label="Main navigation" className="space-y-2">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname.startsWith(href) ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${pathname.startsWith(href) ? 'bg-lime-200 text-teal-950' : 'text-teal-100 hover:bg-white/10'}`}>
          <Icon size={18} />{label}{href === '/notifications' && unreadCount > 0 && <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-xs">{unreadCount}</span>}
        </Link>)}
      </nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
        <span className="text-xs text-lime-200">Good times. Fair shares.</span>
        <p className="mt-2 text-sm leading-relaxed text-teal-100/80">Make room for the memories. Keep the money simple.</p>
        <Link href="/groups" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white">Explore your groups <ArrowUpRight size={16} /></Link>
      </div>
      <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-800 text-sm font-semibold text-lime-100">{name.charAt(0).toUpperCase()}</span>
        <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
        <form action="/api/auth/signout" method="POST"><button aria-label="Sign out" title="Sign out" className="rounded-lg p-2 text-teal-200 hover:bg-white/10"><LogOut size={17} /></button></form>
      </div>
    </aside>
    <div className="lg:pl-64">
      <header className="flex min-h-20 items-center justify-between gap-4 border-b border-border bg-white/70 px-5 sm:px-9">
        <div className="lg:hidden"><Brand /></div>
        <div className="hidden text-sm text-muted-foreground lg:block">Your workspace <span className="mx-3 text-border">/</span><span className="font-medium text-foreground">{current?.label ?? 'Overview'}</span></div>
        <div className="flex items-center gap-3">
          <Link href="/notifications" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} className="relative rounded-full border border-border bg-white p-2.5 text-teal-900 hover:bg-secondary"><Bell size={18} />{unreadCount > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-teal-600 ring-2 ring-white" />}</Link>
          <form className="lg:hidden" action="/api/auth/signout" method="POST"><button aria-label="Sign out" className="rounded-full p-2.5 text-teal-900"><LogOut size={18} /></button></form>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-[1440px] px-5 py-8 pb-28 sm:px-9 sm:py-10 lg:pb-12">{children}</main>
    </div>
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-border bg-white px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
      {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname.startsWith(href) ? 'page' : undefined} className={`flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium ${pathname.startsWith(href) ? 'bg-teal-50 text-teal-900' : 'text-muted-foreground'}`}><Icon size={20} />{label}</Link>)}
    </nav>
  </div>
}
