import Link from 'next/link'
import { Split } from 'lucide-react'

export default function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" aria-label="SplitSmart home" className={`inline-flex items-center gap-2.5 text-xl font-semibold tracking-tight ${light ? 'text-white' : 'text-teal-950'}`}>
    <span className={`flex size-9 items-center justify-center rounded-xl ${light ? 'bg-lime-200 text-teal-950' : 'bg-teal-900 text-lime-200'}`}><Split size={21} strokeWidth={2.5} /></span>
    SplitSmart<span className={light ? 'text-lime-200' : 'text-teal-600'}>.</span>
  </Link>
}
