'use client';

import Link from 'next/link';
import { InteractiveGrid } from '@/components/InteractiveGrid';

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5">
          <div className="bg-orange-500 rounded-sm" />
          <div className="bg-orange-500/60 rounded-sm" />
          <div className="bg-orange-500/30 rounded-sm" />
          <div className="bg-orange-500 rounded-sm" />
        </div>
      </div>
      <span className="font-mono text-sm font-medium tracking-tight">psychophant</span>
    </div>
  );
}

function FeatureCard({
  number,
  title,
  description
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative border border-white/10 bg-black/50 backdrop-blur-sm p-6 hover:border-orange-500/50 transition-all duration-300">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="font-mono text-xs text-orange-500 mb-3">{number}</div>
      <h3 className="font-mono text-sm font-medium mb-2">{title}</h3>
      <p className="font-mono text-xs text-white/50 leading-relaxed">{description}</p>
    </div>
  );
}

function UseCaseTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-mono text-xs border border-white/20 px-3 py-1.5 hover:border-orange-500/50 hover:text-orange-500 transition-colors cursor-default">
      {children}
    </span>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen bg-black text-white font-mono noise-overlay">
      {/* Interactive Grid Background */}
      <div className="fixed inset-0 z-0">
        <InteractiveGrid />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-6">
            <Logo />
            <nav className="flex items-center gap-6">
              <Link
                href="/login"
                className="font-mono text-xs text-white/60 hover:text-white transition-colors"
              >
                sign in
              </Link>
              <Link
                href="/register"
                className="font-mono text-xs bg-orange-500 text-black px-4 py-1.5 hover:bg-orange-400 transition-colors"
              >
                get started
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <main className="pt-14">
          <section className="min-h-[90vh] flex flex-col justify-center px-6">
            <div className="max-w-6xl mx-auto">
              <div className="max-w-3xl">
                <div className="animate-fade-in-up">
                  <p className="font-mono text-xs text-orange-500 mb-4 tracking-widest uppercase">
                    multi-agent ai platform
                  </p>
                </div>

                <h1 className="animate-fade-in-up-delay-1 text-4xl sm:text-5xl md:text-6xl font-mono font-bold tracking-tight leading-[1.1] mb-6">
                  AI agents that
                  <br />
                  <span className="text-orange-500 text-glow">actually disagree</span>
                </h1>

                <p className="animate-fade-in-up-delay-2 font-mono text-sm text-white/50 max-w-xl leading-relaxed mb-10">
                  Create multiple AI agents with hidden instructions. Watch them debate
                  your ideas, find flaws, and reach consensus. Get perspectives you
                  never thought of.
                </p>

                <div className="animate-fade-in-up-delay-3 flex flex-wrap items-center gap-4">
                  <Link
                    href="/register"
                    className="font-mono text-sm bg-orange-500 text-black px-6 py-3 hover:bg-orange-400 transition-colors glow-orange"
                  >
                    start free
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="font-mono text-sm border border-white/20 px-6 py-3 hover:border-white/40 transition-colors"
                  >
                    how it works
                  </Link>
                </div>

                <p className="animate-fade-in-up-delay-3 font-mono text-xs text-white/30 mt-6">
                  $0.10 free credit daily. no credit card required.
                </p>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="border-t border-white/5 py-16 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <div className="font-mono text-3xl font-bold text-orange-500">2-5</div>
                  <div className="font-mono text-xs text-white/40 mt-1">agents per debate</div>
                </div>
                <div>
                  <div className="font-mono text-3xl font-bold text-orange-500">10+</div>
                  <div className="font-mono text-xs text-white/40 mt-1">ai models available</div>
                </div>
                <div>
                  <div className="font-mono text-3xl font-bold text-orange-500">real</div>
                  <div className="font-mono text-xs text-white/40 mt-1">disagreement</div>
                </div>
                <div>
                  <div className="font-mono text-3xl font-bold text-orange-500">0</div>
                  <div className="font-mono text-xs text-white/40 mt-1">sycophancy</div>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section id="how-it-works" className="border-t border-white/5 py-24 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-16">
                <p className="font-mono text-xs text-orange-500 mb-3 tracking-widest uppercase">process</p>
                <h2 className="font-mono text-2xl font-bold">how it works</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <FeatureCard
                  number="01"
                  title="create agents"
                  description="Build AI agents with unique personalities and hidden system prompts. A skeptical VC, an optimistic founder, a pragmatic advisor."
                />
                <FeatureCard
                  number="02"
                  title="watch them debate"
                  description="Agents take turns responding. Each only sees the conversation, not each other's secret instructions. Real disagreement emerges."
                />
                <FeatureCard
                  number="03"
                  title="force agreement"
                  description="In collaborate mode, make agents negotiate until unanimous. Get plans that satisfy multiple perspectives."
                />
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="border-t border-white/5 py-24 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-16">
                <div>
                  <p className="font-mono text-xs text-orange-500 mb-3 tracking-widest uppercase">modes</p>
                  <h2 className="font-mono text-2xl font-bold mb-6">debate or collaborate</h2>
                  <div className="space-y-4">
                    <div className="border-l-2 border-orange-500 pl-4">
                      <h3 className="font-mono text-sm font-medium mb-1">debate mode</h3>
                      <p className="font-mono text-xs text-white/50">Fixed rounds. Agents argue their positions. You get multiple perspectives without consensus.</p>
                    </div>
                    <div className="border-l-2 border-white/20 pl-4">
                      <h3 className="font-mono text-sm font-medium mb-1">collaborate mode</h3>
                      <p className="font-mono text-xs text-white/50">Agents build on each other&apos;s ideas. Force agreement makes them negotiate until unanimous.</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="font-mono text-xs text-orange-500 mb-3 tracking-widest uppercase">control</p>
                  <h2 className="font-mono text-2xl font-bold mb-6">stay in command</h2>
                  <div className="space-y-4">
                    <div className="border-l-2 border-white/20 pl-4">
                      <h3 className="font-mono text-sm font-medium mb-1">interject anytime</h3>
                      <p className="font-mono text-xs text-white/50">Pause the conversation, add your own message, then resume. Guide the discussion your way.</p>
                    </div>
                    <div className="border-l-2 border-white/20 pl-4">
                      <h3 className="font-mono text-sm font-medium mb-1">branch conversations</h3>
                      <p className="font-mono text-xs text-white/50">Fork from any point to explore different paths. What-if scenarios without losing context.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Use Cases */}
          <section className="border-t border-white/5 py-24 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-12">
                <p className="font-mono text-xs text-orange-500 mb-3 tracking-widest uppercase">applications</p>
                <h2 className="font-mono text-2xl font-bold">perfect for</h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <UseCaseTag>startup pitch testing</UseCaseTag>
                <UseCaseTag>product spec review</UseCaseTag>
                <UseCaseTag>strategy debates</UseCaseTag>
                <UseCaseTag>creative writing feedback</UseCaseTag>
                <UseCaseTag>code review perspectives</UseCaseTag>
                <UseCaseTag>decision modeling</UseCaseTag>
                <UseCaseTag>stakeholder simulation</UseCaseTag>
                <UseCaseTag>red teaming ideas</UseCaseTag>
                <UseCaseTag>negotiation practice</UseCaseTag>
                <UseCaseTag>interview prep</UseCaseTag>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="border-t border-white/5 py-24 px-6">
            <div className="max-w-6xl mx-auto text-center">
              <h2 className="font-mono text-2xl md:text-3xl font-bold mb-4">
                stop getting <span className="text-orange-500">yes-man</span> responses
              </h2>
              <p className="font-mono text-sm text-white/50 max-w-md mx-auto mb-8">
                Create agents that challenge your thinking. Real disagreement leads to better decisions.
              </p>
              <Link
                href="/register"
                className="inline-block font-mono text-sm bg-orange-500 text-black px-8 py-3 hover:bg-orange-400 transition-colors glow-orange"
              >
                start free today
              </Link>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-white/5 py-8 px-6">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <Logo />
              <p className="font-mono text-xs text-white/30">
                &copy; {new Date().getFullYear()} psychophant. fight the sycophancy.
              </p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
