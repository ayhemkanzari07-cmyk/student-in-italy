"use client";

import { useState } from "react";

export default function ApplyPage() {
  const [job, setJob] = useState("");
  const [city, setCity] = useState("");
  const [italianLevel, setItalianLevel] = useState("");
  const [experience, setExperience] = useState("");
  const [jobOffer, setJobOffer] = useState("");

  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setResult("");
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job,
          city,
          italianLevel,
          experience,
          jobOffer,
        }),
      });

      const text = await response.text();

      console.log("API status:", response.status);
      console.log("API response:", text);

      if (!response.ok) {
        throw new Error(text || `Server error: ${response.status}`);
      }

      if (!text) {
        throw new Error("The API returned an empty response.");
      }

      const data = JSON.parse(text);

      if (!data.success) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data.result);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-2xl">

        <a
          href="/"
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          ← Back to home
        </a>

        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">

          <h1 className="text-3xl font-bold text-gray-900">
            Create your job application
          </h1>

          <p className="mt-2 text-gray-600">
            Tell us about the job you're applying for.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">

            <div>
              <label className="block text-sm font-semibold text-gray-900">
                What job are you applying for?
              </label>

              <input
                type="text"
                value={job}
                onChange={(e) => setJob(e.target.value)}
                placeholder="e.g. Cameriere, Barista, Magazziniere"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">
                City
              </label>

              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Brescia"
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Your Italian level
              </label>

              <select
                value={italianLevel}
                onChange={(e) => setItalianLevel(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              >
                <option value="">Select your level</option>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Tell us about your experience
              </label>

              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                rows={5}
                placeholder="Example: I worked as a waiter for 1 year..."
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Paste the job offer
              </label>

              <textarea
                value={jobOffer}
                onChange={(e) => setJobOffer(e.target.value)}
                rows={7}
                placeholder="Paste the job description here..."
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-green-600 py-4 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Generating your application..."
                : "Generate my application →"}
            </button>

          </form>

          {error && (
            <div className="mt-8 rounded-2xl bg-red-50 p-6 text-red-700">
              <strong>Error:</strong>
              <div className="mt-2 whitespace-pre-wrap">
                {error}
              </div>
            </div>
          )}

          {result && (
            <div className="mt-8 rounded-2xl bg-green-50 p-6">
              <h2 className="text-xl font-bold text-gray-900">
                Your application pack ✅
              </h2>

              <div className="mt-5 whitespace-pre-wrap text-gray-800">
                {result}
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}