'use client';

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold">dashboard</h1>
        <p className="mt-2 text-xs text-white/50">
          create ai agents and watch them debate your ideas.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/agents/new" className="group border border-white/10 bg-white/5 p-6 hover:border-orange-500/50 transition-colors">
          <div className="text-xs text-orange-500 mb-2">01</div>
          <h3 className="text-sm font-medium mb-2">create an agent</h3>
          <p className="text-xs text-white/50">
            build ai agents with unique personalities and hidden instructions.
          </p>
        </Link>

        <Link href="/conversations/new?mode=debate" className="group border border-white/10 bg-white/5 p-6 hover:border-orange-500/50 transition-colors">
          <div className="text-xs text-orange-500 mb-2">02</div>
          <h3 className="text-sm font-medium mb-2">start a debate</h3>
          <p className="text-xs text-white/50">
            pit your agents against each other to stress-test an idea.
          </p>
        </Link>

        <Link href="/conversations/new?mode=collaborate" className="group border border-white/10 bg-white/5 p-6 hover:border-orange-500/50 transition-colors">
          <div className="text-xs text-orange-500 mb-2">03</div>
          <h3 className="text-sm font-medium mb-2">start a collaboration</h3>
          <p className="text-xs text-white/50">
            have agents work together to build on ideas.
          </p>
        </Link>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-sm font-medium mb-4">recent conversations</h2>
        <div className="border border-white/10">
          <div className="p-8 text-center">
            <p className="text-xs text-white/50">no conversations yet.</p>
            <p className="mt-2 text-xs text-white/30">
              create some agents and start your first debate!
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/50">total agents</p>
          <p className="mt-1 text-xl font-bold">0</p>
        </div>
        <div className="border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/50">conversations</p>
          <p className="mt-1 text-xl font-bold">0</p>
        </div>
        <div className="border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/50">total spent</p>
          <p className="mt-1 text-xl font-bold">$0.00</p>
        </div>
        <div className="border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-white/50">credit balance</p>
          <p className="mt-1 text-xl font-bold text-orange-500">$0.10</p>
        </div>
      </div>
    </div>
  );
}
