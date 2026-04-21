export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 font-mono">
      <h1 className="text-3xl font-semibold tracking-tight">kst-music</h1>
      <p className="max-w-xl text-center text-sm text-neutral-600 dark:text-neutral-300">
        Making AI-generated music and sample creation more accessible, less
        mystifying, and more fun for producers.
      </p>
      <p className="text-xs text-neutral-500">
        Pipeline check: <a className="underline" href="/api/hello">/api/hello</a>
      </p>
    </main>
  );
}
