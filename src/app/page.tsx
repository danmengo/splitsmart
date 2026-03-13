import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Receipt, TrendingUp, Bell, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-green-600">SplitSmart</span>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-green-600 hover:bg-green-700">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 leading-tight">
            Split expenses,<br />not friendships.
          </h1>
          <p className="mt-6 text-lg text-gray-500 leading-relaxed">
            Track shared expenses with roommates, friends, and groups. See who owes what at a glance, settle up in one click, and never argue about money again.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-base px-8">
                Start for free
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-base px-8">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Everything you need to split expenses fairly
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Users size={24} />}
              title="Groups"
              description="Create groups for roommates, trips, dinners — anything. Invite members by email."
            />
            <FeatureCard
              icon={<Receipt size={24} />}
              title="Flexible splits"
              description="Split equally or by custom percentages. Add expenses in seconds."
            />
            <FeatureCard
              icon={<TrendingUp size={24} />}
              title="Balance tracking"
              description="See who owes what in real time. Dashboard charts show spending at a glance."
            />
            <FeatureCard
              icon={<Bell size={24} />}
              title="Notifications"
              description="Get notified when expenses are added or when someone settles up."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-3xl mx-auto">
            <Step number="1" title="Create a group" description="Add a group and invite your friends or roommates." />
            <Step number="2" title="Add expenses" description="Log who paid and how to split it — equal or by percentage." />
            <Step number="3" title="Settle up" description="See balances and settle debts with one click." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 bg-green-600">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to stop tracking expenses in your head?
          </h2>
          <p className="text-green-100 mb-8">Free to use. No credit card required.</p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 text-base px-8">
              Get started
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-400">
          SplitSmart &middot; Split expenses, not friendships.
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-100 text-green-600 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  )
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-600 text-white font-bold text-sm mb-4">
        {number}
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  )
}
