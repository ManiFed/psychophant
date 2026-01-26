import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Link href="/" className="text-2xl font-bold text-primary">
            Psychophant
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Psychophant. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
