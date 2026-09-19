"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main style={{ fontFamily: "system-ui, sans-serif", margin: "4rem auto", maxWidth: "42rem", padding: "1.5rem" }}>
          <h1>Something went wrong</h1>
          <p>Please try the request again.</p>
          <button type="button" onClick={() => reset()} style={{ marginTop: "1rem", padding: "0.65rem 1rem" }}>Try again</button>
        </main>
      </body>
    </html>
  );
}
