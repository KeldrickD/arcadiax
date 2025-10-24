import Link from 'next/link';

export const metadata = {
  title: 'ArcadiaX — Legal',
  description: 'Terms, Privacy, and Game Rules for ArcadiaX.',
  robots: { index: true, follow: true },
};

const gradientText = "bg-gradient-to-r from-[#7C3AED] via-[#00E0FF] to-[#7C3AED] bg-clip-text text-transparent";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen w-full bg-[#0A0A0F] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0A0A0F]/80 backdrop-blur supports-[backdrop-filter]:bg-[#0A0A0F]/60">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">
            <span className={`text-base md:text-lg ${gradientText}`}>ArcadiaX</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/rules" className="hover:text-white">Game Rules</Link>
          </nav>
          <div className="flex items-center gap-2">
            <a
              href="https://whop.com/apps/app_tdIWpN1FBD3t8e/install/"
              className="inline-flex items-center rounded-md bg-[#7C3AED] hover:bg-[#6b2fe2] px-3 py-1.5 text-sm font-medium"
            >Install on Whop</a>
          </div>
        </div>
      </header>

      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full blur-3xl bg-[#7C3AED]/20" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full blur-3xl bg-[#00E0FF]/20" />
      </div>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-2xl p-6 md:p-8 backdrop-blur-md bg-white/5 border border-white/10">
          {children}
        </div>
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          <QuickLink href="/terms" label="Terms of Service" />
          <QuickLink href="/privacy" label="Privacy Policy" />
          <QuickLink href="/rules" label="Game Rules" />
        </div>
        <div className="mt-10 flex items-center justify-between text-sm text-white/60">
          <Link href="/" className="hover:text-white">Back to home</Link>
          <p>© {new Date().getFullYear()} ArcadiaX</p>
        </div>
      </section>
    </main>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="block rounded-xl p-4 text-sm hover:bg-white/10 border border-white/10">
      <div className="font-medium text-white/90">{label}</div>
      <div className="text-white/60">Read the full policy</div>
    </Link>
  );
}


