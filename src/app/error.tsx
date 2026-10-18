"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-20">
      <h1 className="text-4xl">Something went wrong.</h1>
      <p className="mt-3 text-muted">Try that again. If it keeps failing, restart the app and reload.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex rounded-full bg-rise px-4 py-2.5 text-sm font-medium text-ink"
      >
        Try again
      </button>
    </main>
  );
}
