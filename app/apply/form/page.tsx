"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function ApplicationForm() {
  const searchParams = useSearchParams();

  const job = searchParams.get("job") || "";
  const company = searchParams.get("company") || "";
  const location = searchParams.get("location") || "";
  const description = searchParams.get("description") || "";

  const [name, setName] = useState("");
  const [italianLevel, setItalianLevel] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState("");
  const [cv, setCv] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job,
          company,
          location,
          description,
          name,
          italianLevel,
          experience,
          skills,
          availability,
          cvName: cv?.name || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setMessage(data.message);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

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
            YOUR APPLICATION
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Tell us about yourself
          </h1>

          <p className="mt-2 text-gray-600">
            We will use your information to prepare your application.
          </p>

          <div className="mt-8 rounded-2xl bg-gray-50 p-5">

            <p className="text-sm text-gray-500">
              Applying for
            </p>

            <h2 className="mt-1 text-xl font-bold text-gray-900">
              {job}
            </h2>

            {company && (
              <p className="mt-1 text-gray-600">
                🏢 {company}
              </p>
            )}

            {location && (
              <p className="mt-1 text-gray-600">
                📍 {location}
              </p>
            )}

          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >

            {/* CV */}
            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Upload your CV
                <span className="ml-2 font-normal text-gray-500">
                  (optional)
                </span>
              </label>

              <p className="mt-1 text-sm text-gray-500">
                Don't have a CV? No problem. We can create one from your
                information.
              </p>

              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setCv(e.target.files?.[0] || null)}
                className="mt-3 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700"
              />

              {cv && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ {cv.name}
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Your name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ayhem Kanzari"
                required
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            {/* Italian */}
            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Your Italian level
              </label>

              <select
                value={italianLevel}
                onChange={(e) => setItalianLevel(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              >
                <option value="">
                  Select your level
                </option>

                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
                <option value="B2">B2</option>
                <option value="C1">C1</option>
                <option value="C2">C2</option>
              </select>
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Your experience
              </label>

              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Tell us about your previous work experience..."
                rows={5}
                required
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Your skills
              </label>

              <textarea
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. Customer service, teamwork, communication..."
                rows={4}
                required
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Your availability
              </label>

              <input
                type="text"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="e.g. Part-time, weekends, evenings..."
                required
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-green-600 py-4 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Preparing..."
                : "Prepare my application →"}
            </button>

          </form>

          {message && (
            <div className="mt-6 rounded-2xl bg-green-50 p-5 text-green-700">
              {message}
            </div>
          )}

        </div>

      </div>
    </main>
  );
}

export default function FormPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <ApplicationForm />
    </Suspense>
  );
}