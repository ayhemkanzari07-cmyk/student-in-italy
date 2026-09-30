"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ApplyPageContent() {
  const searchParams = useSearchParams();

  const job = searchParams.get("job") || "";
  const company = searchParams.get("company") || "";
  const location = searchParams.get("location") || "";
  const description = searchParams.get("description") || "";
  const url = searchParams.get("url") || "";

  const formUrl =
    `/apply/form?job=${encodeURIComponent(job)}` +
    `&company=${encodeURIComponent(company)}` +
    `&location=${encodeURIComponent(location)}` +
    `&description=${encodeURIComponent(description)}` +
    `&url=${encodeURIComponent(url)}`;

  return (
    <main className="min-h-screen bg-gray-50">

      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <a
            href="/"
            className="text-2xl font-bold text-gray-900"
          >
            Student<span className="text-green-600">InItaly</span>
          </a>

          <a
            href="/jobs"
            className="rounded-full border border-gray-300 px-5 py-2.5 font-semibold text-gray-900 hover:bg-gray-50"
          >
            ← Find another job
          </a>

        </div>
      </nav>

      <section className="px-6 py-12">

        <div className="mx-auto max-w-4xl">

          <div className="mb-8">

            <p className="text-sm font-semibold text-green-600">
              APPLICATION
            </p>

            <h1 className="mt-2 text-4xl font-bold text-gray-900">
              Apply with StudentInItaly 🤖
            </h1>

            <p className="mt-3 text-lg text-gray-600">
              We will help you prepare a professional application adapted
              to this job.
            </p>

          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">

            <p className="text-sm font-semibold text-gray-500">
              SELECTED JOB
            </p>

            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              {job || "Job"}
            </h2>

            {company && (
              <p className="mt-3 text-gray-600">
                🏢 {company}
              </p>
            )}

            {location && (
              <p className="mt-1 text-gray-600">
                📍 {location}
              </p>
            )}

            {description && (
              <div className="mt-8">

                <p className="text-sm font-semibold text-gray-500">
                  JOB DESCRIPTION
                </p>

                <div className="mt-3 rounded-2xl bg-gray-50 p-5">

                  <p className="whitespace-pre-line text-gray-700">
                    {description}
                  </p>

                </div>

              </div>
            )}

          </div>

          <div className="mt-6 rounded-3xl border border-green-100 bg-green-50 p-8">

            <h2 className="text-2xl font-bold text-gray-900">
              Ready to apply? 🚀
            </h2>

            <p className="mt-3 text-gray-600">
              Tell us a little about yourself and we will prepare your
              application package.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-3">

              <div className="rounded-2xl bg-white p-5">

                <div className="text-2xl">
                  📄
                </div>

                <h3 className="mt-3 font-bold text-gray-900">
                  CV
                </h3>

                <p className="mt-1 text-sm text-gray-600">
                  Upload your CV or create one from your information.
                </p>

              </div>

              <div className="rounded-2xl bg-white p-5">

                <div className="text-2xl">
                  ✉️
                </div>

                <h3 className="mt-3 font-bold text-gray-900">
                  Application
                </h3>

                <p className="mt-1 text-sm text-gray-600">
                  Prepare your email, WhatsApp message and cover letter.
                </p>

              </div>

              <div className="rounded-2xl bg-white p-5">

                <div className="text-2xl">
                  🎤
                </div>

                <h3 className="mt-3 font-bold text-gray-900">
                  Interview
                </h3>

                <p className="mt-1 text-sm text-gray-600">
                  Get questions and answers to prepare for the interview.
                </p>

              </div>

            </div>

            <a
              href={formUrl}
              className="mt-8 block w-full rounded-full bg-green-600 px-8 py-4 text-center font-semibold text-white transition hover:bg-green-700"
            >
              Start my application →
            </a>

          </div>

        </div>

      </section>

    </main>
  );
}

export default function ApplyPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 px-6 py-12">

          <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 text-center shadow-sm">

            <p className="text-gray-600">
              Loading job...
            </p>

          </div>

        </main>
      }
    >
      <ApplyPageContent />
    </Suspense>
  );
}