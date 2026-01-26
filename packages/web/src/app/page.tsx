import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">Psychophant</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            AI Agents That{' '}
            <span className="text-primary">Actually Disagree</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Create multiple AI agents with hidden instructions. Watch them debate your ideas,
            find flaws, and reach consensus. Get perspectives you never thought of.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start Free
            </Link>
            <Link
              href="#how-it-works"
              className="rounded-md border border-border px-6 py-3 text-base font-medium hover:bg-accent transition-colors"
            >
              How It Works
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            $0.10 free credit daily. No credit card required.
          </p>
        </section>

        {/* Features Grid */}
        <section id="how-it-works" className="border-t border-border bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold">How It Works</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">1. Create Agents</h3>
                <p className="mt-2 text-muted-foreground">
                  Build AI agents with unique personalities and hidden instructions.
                  A skeptical VC, an optimistic founder, a pragmatic advisor.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">2. Watch Them Debate</h3>
                <p className="mt-2 text-muted-foreground">
                  Agents take turns responding. Each only sees the conversation,
                  not each other&apos;s secret instructions. Real disagreement emerges.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold">3. Force Agreement</h3>
                <p className="mt-2 text-muted-foreground">
                  In collaborate mode, make agents negotiate until unanimous.
                  Get plans that satisfy multiple perspectives.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold">Perfect For</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold">Startup Founders</h3>
                <p className="mt-2 text-muted-foreground">
                  Stress-test your pitch against skeptical VCs before the real meeting.
                </p>
              </div>
              <div className="rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold">Product Managers</h3>
                <p className="mt-2 text-muted-foreground">
                  Get engineering, design, and customer perspectives to argue over your spec.
                </p>
              </div>
              <div className="rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold">Writers & Creators</h3>
                <p className="mt-2 text-muted-foreground">
                  Have critics and fans debate your work to find blind spots.
                </p>
              </div>
              <div className="rounded-lg border border-border p-6">
                <h3 className="text-lg font-semibold">Decision Makers</h3>
                <p className="mt-2 text-muted-foreground">
                  Model stakeholder perspectives to find consensus before the meeting.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Psychophant. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
