"use client";

import { useState } from "react";

type JobResult = {
  id: string;
  title: string;
  company?: {
    display_name?: string;
  };
  location?: {
    display_name?: string;
  };
  description?: string;
  redirect_url: string;
};

export default function JobsPage() {
  const [job, setJob] = useState("");
  const [city, setCity] = useState("");

  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setJobs([]);

    try {
      const response = await fetch(
        `/api/jobs?query=${encodeURIComponent(job)}&location=${encodeURIComponent(city)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Something went wrong");
      }

      setJobs(data.results);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">

      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <a href="/" className="text-2xl font-bold">
            Student<span className="text-green-600">InItaly</span>
          </a>

          <a
            href="/apply"
            className="rounded-full bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-700"
          >
            Create application
          </a>

        </div>
      </nav>

      <section className="bg-white px-6 py-14">
        <div className="mx-auto max-w-5xl">

          <h1 className="text-center text-4xl font-bold text-gray-900">
            Find your job in Italy 🇮🇹
          </h1>

          <p className="mt-3 text-center text-gray-600">
            Search real job opportunities and apply with StudentInItaly.
          </p>

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 flex max-w-4xl flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg md:flex-row"
          >

            <input
              type="text"
              value={job}
              onChange={(e) => setJob(e.target.value)}
              placeholder="Job title, e.g. Cameriere"
              className="flex-1 rounded-xl border border-gray-300 px-5 py-4 text-gray-900 outline-none focus:border-green-600"
            />

            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City, e.g. Napoli"
              className="flex-1 rounded-xl border border-gray-300 px-5 py-4 text-gray-900 outline-none focus:border-green-600"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-green-600 px-8 py-4 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? "Searching..." : "Search 🔍"}
            </button>

          </form>

        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-5xl">

          {error && (
            <div className="rounded-2xl bg-red-50 p-5 text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && jobs.length === 0 && (
            <div className="text-center text-gray-500">
              Search for a job to see available opportunities.
            </div>
          )}

          {jobs.length > 0 && (
            <div>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  Jobs found
                </h2>

                <p className="mt-1 text-gray-600">
                  {jobs.length} opportunities found
                </p>
              </div>

              <div className="space-y-5">

                {jobs.map((item) => (

                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                  >

                    <div className="flex flex-col justify-between gap-5 md:flex-row">

                      <div>

                        <h3 className="text-xl font-bold text-gray-900">
                          {item.title}
                        </h3>

                        <p className="mt-2 text-gray-600">
                          {item.company?.display_name || "Company"}
                        </p>

                        <p className="mt-1 text-gray-500">
                          📍 {item.location?.display_name || city}
                        </p>

                        {item.description && (
                          <p className="mt-4 line-clamp-3 text-gray-600">
                            {item.description}
                          </p>
                        )}

                      </div>

                      <div className="flex items-center">

                        <a
                          href={`/apply?job=${encodeURIComponent(
                            item.title
                          )}&company=${encodeURIComponent(
                            item.company?.display_name || ""
                          )}&location=${encodeURIComponent(
                            item.location?.display_name || city
                          )}&description=${encodeURIComponent(
                            item.description || ""
                          )}&url=${encodeURIComponent(
                            item.redirect_url
                          )}`}
                          className="rounded-full bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
                        >
                          Apply with AI →
                        </a>

                      </div>

                    </div>

                    <div className="mt-5 border-t border-gray-100 pt-4 text-xs text-gray-500">
                      Jobs by Adzuna
                    </div>

                  </div>

                ))}

              </div>

            </div>
          )}

        </div>
      </section>

    </main>
  );
}