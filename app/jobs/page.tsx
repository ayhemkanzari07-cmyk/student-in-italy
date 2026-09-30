"use client";

import { useState } from "react";

export default function JobsPage() {
  const [job, setJob] = useState("");
  const [city, setCity] = useState("");

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    console.log("Search:", {
      job,
      city,
    });
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Navigation */}
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

      {/* Search */}
      <section className="bg-white px-6 py-14">
        <div className="mx-auto max-w-5xl">

          <h1 className="text-center text-4xl font-bold text-gray-900">
            Find your job in Italy 🇮🇹
          </h1>

          <p className="mt-3 text-center text-gray-600">
            Search for jobs and apply with StudentInItaly.
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
              placeholder="City, e.g. Brescia"
              className="flex-1 rounded-xl border border-gray-300 px-5 py-4 text-gray-900 outline-none focus:border-green-600"
            />

            <button
              type="submit"
              className="rounded-xl bg-green-600 px-8 py-4 font-semibold text-white hover:bg-green-700"
            >
              Search 🔍
            </button>

          </form>

        </div>
      </section>

      {/* Jobs */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-5xl">

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Latest jobs
            </h2>

            <p className="mt-1 text-gray-600">
              Real opportunities will appear here.
            </p>
          </div>

          {/* Temporary job card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

            <div className="flex flex-col justify-between gap-5 md:flex-row">

              <div>
                <p className="text-sm font-medium text-green-600">
                  DEMO JOB
                </p>

                <h3 className="mt-2 text-xl font-bold text-gray-900">
                  Cameriere
                </h3>

                <p className="mt-2 text-gray-600">
                  Ristorante XYZ · Brescia
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                    Full-time
                  </span>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                    Brescia
                  </span>
                </div>
              </div>

              <div className="flex items-center">
                <button
                  className="rounded-full bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
                >
                  Apply with AI →
                </button>
              </div>

            </div>

          </div>

        </div>
      </section>

    </main>
  );
}