import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">

        <Link href="/" className="text-2xl font-bold">
          Student<span className="text-green-600">InItaly</span>
        </Link>

        <Link
          href="/jobs"
          className="rounded-full bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
        >
          Find a job →
        </Link>

      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-20 text-center">

        <div className="mb-6 inline-block rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
          🇮🇹 Made for international students in Italy
        </div>

        <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-6xl">
          Find a job in Italy.
          <br />
          <span className="text-green-600">
            Apply with confidence.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          Find real job opportunities in Italy and create a professional
          application with AI.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">

          <Link
            href="/jobs"
            className="rounded-full bg-green-600 px-8 py-4 font-semibold text-white transition hover:bg-green-700"
          >
            Find a job →
          </Link>

          <Link
            href="/apply"
            className="rounded-full border border-gray-300 px-8 py-4 font-semibold transition hover:bg-gray-100"
          >
            Create an application
          </Link>

        </div>

      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="bg-gray-50 px-6 py-20"
      >
        <div className="mx-auto max-w-6xl">

          <h2 className="text-center text-3xl font-bold">
            Find a job and apply in 3 steps
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3">

            {/* Step 1 */}
            <div className="rounded-2xl bg-white p-8 shadow-sm">

              <div className="mb-4 text-3xl">
                🔎
              </div>

              <h3 className="text-xl font-semibold">
                1. Find a job
              </h3>

              <p className="mt-3 text-gray-600">
                Search real job opportunities by job title and city.
              </p>

            </div>

            {/* Step 2 */}
            <div className="rounded-2xl bg-white p-8 shadow-sm">

              <div className="mb-4 text-3xl">
                🤖
              </div>

              <h3 className="text-xl font-semibold">
                2. Apply with AI
              </h3>

              <p className="mt-3 text-gray-600">
                Create a professional application adapted to the job.
              </p>

            </div>

            {/* Step 3 */}
            <div className="rounded-2xl bg-white p-8 shadow-sm">

              <div className="mb-4 text-3xl">
                🚀
              </div>

              <h3 className="text-xl font-semibold">
                3. Get hired
              </h3>

              <p className="mt-3 text-gray-600">
                Send your application to Italian employers with confidence.
              </p>

            </div>

          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">

        <h2 className="text-3xl font-bold">
          Ready to find your next job?
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-gray-600">
          Search thousands of opportunities and start applying today.
        </p>

        <Link
          href="/jobs"
          className="mt-8 inline-block rounded-full bg-green-600 px-8 py-4 font-semibold text-white transition hover:bg-green-700"
        >
          Search jobs →
        </Link>

      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        © 2026 StudentInItaly. Built for international students in Italy.
      </footer>

    </main>
  );
}