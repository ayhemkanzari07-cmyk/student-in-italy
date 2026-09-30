"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ApplyContent() {
  const searchParams = useSearchParams();

  const job = searchParams.get("job") || "";
  const company = searchParams.get("company") || "";
  const location = searchParams.get("location") || "";
  const description = searchParams.get("description") || "";
  const url = searchParams.get("url") || "";

  const applicationUrl =
    `/apply/form?job=${encodeURIComponent(job)}` +
    `&company=${encodeURIComponent(company)}` +
    `&location=${encodeURIComponent(location)}` +
    `&description=${encodeURIComponent(description)}` +
    `&url=${encodeURIComponent(url)}`;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">

        <a
          href="/jobs"
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          ← Back to jobs
        </a>

        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">

          <p className="text-sm font-semibold text-green-600">
            APPLY WITH AI
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {job || "Selected job"}
          </h1>

          <div className="mt-4 space-y-1 text-gray-600">
            {company && <p>🏢 {company}</p>}
            {location && <p>📍 {location}</p>}
          </div>

          {description && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900">
                Job description
              </h2>

              <p className="mt-3 whitespace-pre-line text-gray-600">
                {description}
              </p>
            </div>
          )}

          <div className="mt-8 rounded-2xl bg-green-50 p-6">

            <h2 className="text-xl font-bold text-gray-900">
              Ready to apply? 🚀
            </h2>

            <p className="mt-2 text-gray-600">
              Tell us about yourself and StudentInItaly will prepare
              your application for this job.
            </p>

            <a
              href={applicationUrl}
              className="mt-6 block w-full rounded-full bg-green-600 px-6 py-4 text-center font-semibold text-white transition hover:bg-green-700"
            >
              Start my application →
            </a>

          </div>

          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 block text-center text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              View original job on Adzuna →
            </a>
          )}

        </div>

      </div>
    </main>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <ApplyContent />
    </Suspense>
  );
}