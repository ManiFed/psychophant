'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Welcome to Psychophant</h1>
        <p className="mt-2 text-muted-foreground">
          Create AI agents and watch them debate your ideas.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold">Create an Agent</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Build AI agents with unique personalities and hidden instructions.
          </p>
          <Link href="/agents/new">
            <Button className="mt-4">Create Agent</Button>
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold">Start a Debate</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Pit your agents against each other to stress-test an idea.
          </p>
          <Link href="/conversations/new?mode=debate">
            <Button className="mt-4" variant="outline">
              Start Debate
            </Button>
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold">Start a Collaboration</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Have agents work together to build on ideas.
          </p>
          <Link href="/conversations/new?mode=collaborate">
            <Button className="mt-4" variant="outline">
              Start Collaboration
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold">Recent Conversations</h2>
        <div className="mt-4 rounded-lg border border-border">
          <div className="p-8 text-center text-muted-foreground">
            <p>No conversations yet.</p>
            <p className="mt-2 text-sm">
              Create some agents and start your first debate!
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Agents</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Conversations</p>
          <p className="mt-1 text-2xl font-bold">0</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Spent</p>
          <p className="mt-1 text-2xl font-bold">$0.00</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Credit Balance</p>
          <p className="mt-1 text-2xl font-bold text-primary">$0.10</p>
        </div>
      </div>
    </div>
  );
}
