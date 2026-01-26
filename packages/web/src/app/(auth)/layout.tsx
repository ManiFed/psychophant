import Link from 'next/link';

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="relative w-6 h-6">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5">
          <div className="bg-orange-500 rounded-sm" />
          <div className="bg-orange-500/60 rounded-sm" />
          <div className="bg-orange-500/30 rounded-sm" />
          <div className="bg-orange-500 rounded-sm" />
        </div>
      </div>
      <span className="font-mono text-sm font-medium tracking-tight">psychophant</span>
    </Link>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-white/5">
        <div className="max-w-6xl mx-auto flex h-14 items-center px-6">
          <Logo />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-4">
        <div className="max-w-6xl mx-auto text-center font-mono text-xs text-white/30 px-6">
          &copy; {new Date().getFullYear()} psychophant. fight the sycophancy.
        </div>
      </footer>
    </div>
  );
}
