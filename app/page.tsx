import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
        <div className="text-2xl font-bold">
          Student<span className="text-green-600">InItaly</span>
        </div>

        <Link
          href="/apply"
          className="rounded-full bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
        >
          Create my application →
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
          Create a professional job application in minutes,
          even if your Italian isn't perfect.
        </p>

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">

          <Link
            href="/apply"
            className="rounded-full bg-green-600 px-8 py-4 font-semibold text-white transition hover:bg-green-700"
          >
            Get started →
          </Link>

          <a
            href="#how-it-works"
            className="rounded-full border border-gray-300 px-8 py-4 font-semibold transition hover:bg-gray-100"
          >
            How it works
          </a>

        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="bg-gray-50 px-6 py-20"
      >
        <div className="mx-auto max-w-6xl">

          <h2 className="text-center text-3xl font-bold">
            Get ready to apply in 3 steps
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3">

            {/* Step 1 */}
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-4 text-3xl">
                📄
              </div>

              <h3 className="text-xl font-semibold">
                1. Add your information
              </h3>

              <p className="mt-3 text-gray-600">
                Tell us about your experience, skills and the job you want.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-4 text-3xl">
                🤖
              </div>

              <h3 className="text-xl font-semibold">
                2. Build your application
              </h3>

              <p className="mt-3 text-gray-600">
                Our AI creates a message, email and cover letter adapted to
                the job.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-4 text-3xl">
                🚀
              </div>

              <h3 className="text-xl font-semibold">
                3. Apply
              </h3>

              <p className="mt-3 text-gray-600">
                Send your application to Italian employers with confidence.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20 text-center">

        <p className="text-sm font-semibold text-green-600">
          SIMPLE PRICING
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          Your first application, made easy.
        </h2>

        <p className="mt-4 text-gray-600">
          One simple application pack.
        </p>

        <div className="mx-auto mt-10 max-w-sm rounded-3xl border border-gray-200 p-8 shadow-sm">

          <h3 className="text-xl font-semibold">
            Job Application Pack
          </h3>

          <div className="mt-5 text-5xl font-bold">
            €4.90
          </div>

          <p className="mt-2 text-gray-500">
            per application
          </p>

          <ul className="mt-8 space-y-3 text-left text-gray-700">
            <li>✓ CV adapted to the job</li>
            <li>✓ WhatsApp message</li>
            <li>✓ Professional email</li>
            <li>✓ Cover letter</li>
            <li>✓ Interview preparation</li>
          </ul>

          <Link
            href="/apply"
            className="mt-8 block w-full rounded-full bg-green-600 py-3 text-center font-semibold text-white transition hover:bg-green-700"
          >
            Get started →
          </Link>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        © 2026 StudentInItaly. Built for international students in Italy.
      </footer>

    </main>
  );
}
