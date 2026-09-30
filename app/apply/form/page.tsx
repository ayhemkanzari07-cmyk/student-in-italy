"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type Profile = {
  full_name: string | null;
  phone: string | null;
  italian_level: string | null;
  experience: string | null;
  skills: string | null;
  availability: string | null;
  package_type: "none" | "basic" | "pro" | "monthly";
  credits: number;
};

type CV = {
  id: string;
  file_name: string;
  file_type: string;
};

function ApplicationForm() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const jobId = searchParams.get("jobId") || "";
  const job = searchParams.get("job") || "";
  const company = searchParams.get("company") || "";
  const location = searchParams.get("location") || "";
  const description = searchParams.get("description") || "";
  const jobUrl = searchParams.get("jobUrl") || "";

  const [profile, setProfile] = useState<Profile | null>(null);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [selectedCv, setSelectedCv] = useState("");

  const [name, setName] = useState("");
  const [italianLevel, setItalianLevel] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [availability, setAvailability] = useState("");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`;
        return;
      }

      try {
        const [profileResponse, cvsResponse] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/cvs"),
        ]);

        const profileData = await profileResponse.json();
        const cvsData = await cvsResponse.json();

        if (!profileResponse.ok) {
          throw new Error(
            profileData.error || "Could not load your profile."
          );
        }

        setProfile(profileData.profile);

        setName(profileData.profile.full_name || "");
        setItalianLevel(profileData.profile.italian_level || "");
        setExperience(profileData.profile.experience || "");
        setSkills(profileData.profile.skills || "");
        setAvailability(profileData.profile.availability || "");

        if (cvsResponse.ok) {
          setCvs(cvsData.cvs || []);

          if (cvsData.cvs?.length > 0) {
            setSelectedCv(cvsData.cvs[0].id);
          }
        }
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not load your information."
        );
      } finally {
        setLoadingProfile(false);
      }
    }

    loadUserData();
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!profile) {
      setMessage("Your profile is not ready yet.");
      return;
    }

    if (profile.credits < 1) {
      setMessage(
        "You don't have any application credits left. Please choose a package first."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    const selectedCV = cvs.find((cv) => cv.id === selectedCv);

    try {
      const response = await fetch("/api/application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          job,
          company,
          location,
          jobUrl,
          description,
          name,
          italianLevel,
          experience,
          skills,
          availability,
          cvName: selectedCV?.file_name || null,
          packageType: profile.package_type,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Something went wrong."
        );
      }

      /*
       * Temporary bridge for the current result page.
       * The next stage will make the result page load the
       * application directly from Supabase using applicationId.
       */
      sessionStorage.setItem(
        "applicationPack",
        JSON.stringify(data.applicationPack)
      );

      sessionStorage.setItem(
        "applicationId",
        data.applicationId
      );

      window.location.href = `/apply/result?id=${encodeURIComponent(
        data.applicationId
      )}`;
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

  if (loadingProfile) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-gray-600">
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">
            Profile unavailable
          </h1>

          <p className="mt-3 text-gray-600">
            We couldn't load your profile. Please log in again.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-block rounded-full bg-black px-6 py-3 font-semibold text-white"
          >
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/jobs"
          className="text-sm font-medium text-green-600 hover:text-green-700"
        >
          ← Back to jobs
        </Link>

        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold text-green-600">
            YOUR APPLICATION
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Prepare your application
          </h1>

          <p className="mt-2 text-gray-600">
            We'll use your profile and CV to prepare your
            application.
          </p>

          <div className="mt-8 rounded-2xl bg-gray-50 p-5">
            <p className="text-sm text-gray-500">
              Applying for
            </p>

            <h2 className="mt-1 text-xl font-bold text-gray-900">
              {job || "Selected job"}
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

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border bg-white p-4">
              <p className="text-sm text-gray-500">
                Package
              </p>
              <p className="mt-1 font-bold capitalize">
                {profile.package_type === "none"
                  ? "No package"
                  : profile.package_type}
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="text-sm text-gray-500">
                Applications available
              </p>
              <p className="mt-1 text-2xl font-bold">
                {profile.credits}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >
            {cvs.length > 0 ? (
              <div>
                <label className="block text-sm font-semibold text-gray-900">
                  Choose your CV
                </label>

                <p className="mt-1 text-sm text-gray-500">
                  Select the CV you'd like us to use.
                </p>

                <select
                  value={selectedCv}
                  onChange={(e) =>
                    setSelectedCv(e.target.value)
                  }
                  className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-green-600"
                >
                  {cvs.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.file_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5">
                <p className="font-semibold text-gray-900">
                  No CV uploaded
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  That's okay. We can create the CV content
                  from your profile information.
                </p>

                <Link
                  href="/dashboard"
                  className="mt-3 inline-block text-sm font-semibold text-green-600 hover:underline"
                >
                  Manage my CVs →
                </Link>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Your name
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Your Italian level
              </label>

              <select
                value={italianLevel}
                onChange={(e) =>
                  setItalianLevel(e.target.value)
                }
                required
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
                Your experience
              </label>

              <textarea
                value={experience}
                onChange={(e) =>
                  setExperience(e.target.value)
                }
                rows={5}
                required
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Your skills
              </label>

              <textarea
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                rows={4}
                required
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Your availability
              </label>

              <input
                type="text"
                value={availability}
                onChange={(e) =>
                  setAvailability(e.target.value)
                }
                required
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-green-600"
              />
            </div>

            {profile.credits > 0 ? (
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-green-600 py-4 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Preparing your application..."
                  : `Use 1 credit & prepare application →`}
              </button>
            ) : (
              <div className="rounded-2xl bg-red-50 p-5">
                <p className="font-semibold text-red-800">
                  You don't have any credits.
                </p>

                <p className="mt-1 text-sm text-red-700">
                  Choose a package to prepare an application.
                </p>

                <Link
                  href="/pricing"
                  className="mt-4 inline-block rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
                >
                  View packages
                </Link>
              </div>
            )}
          </form>

          {message && (
            <div className="mt-6 rounded-2xl bg-red-50 p-5 text-red-700">
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
    <Suspense
      fallback={
        <div className="p-8">
          Loading...
        </div>
      }
    >
      <ApplicationForm />
    </Suspense>
  );
}