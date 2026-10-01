"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Profile = {
  id: string;
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
  created_at: string;
};

type Application = {
  id: string;
  job_id: string | null;
  job_title: string;
  company: string | null;
  location: string | null;
  package_type: string;
  status: string;
  created_at: string;
  expires_at: string;
};

type Subscription = {
  id: string;
  stripe_subscription_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export default function DashboardPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [applications, setApplications] = useState<Application[]>(
    []
  );
  const [subscription, setSubscription] =
    useState<Subscription | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] =
    useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    italian_level: "",
    experience: "",
    skills: "",
    availability: "",
  });

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login?redirect=/dashboard";
        return;
      }

      setEmail(user.email || "");

      const [
        profileResponse,
        cvsResponse,
        subscriptionResponse,
      ] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/cvs"),
        fetch("/api/subscription"),
      ]);

      const profileData = await profileResponse.json();
      const cvsData = await cvsResponse.json();
      const subscriptionData =
        await subscriptionResponse.json();

      if (!profileResponse.ok) {
        throw new Error(
          profileData.error || "Unable to load profile."
        );
      }

      if (!cvsResponse.ok) {
        throw new Error(
          cvsData.error || "Unable to load CVs."
        );
      }

      const loadedProfile = profileData.profile as Profile;

      setProfile(loadedProfile);

      setForm({
        full_name: loadedProfile.full_name || "",
        phone: loadedProfile.phone || "",
        italian_level: loadedProfile.italian_level || "",
        experience: loadedProfile.experience || "",
        skills: loadedProfile.skills || "",
        availability: loadedProfile.availability || "",
      });

      setCvs(cvsData.cvs || []);

      setSubscription(
        subscriptionData.subscription || null
      );

      const {
        data: applicationData,
        error: applicationError,
      } = await supabase
        .from("applications")
        .select(
          "id, job_id, job_title, company, location, package_type, status, created_at, expires_at"
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (applicationError) {
        throw new Error(
          applicationError.message
        );
      }

      setApplications(applicationData || []);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function saveProfile() {
    setSavingProfile(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to save profile."
        );
      }

      setProfile(data.profile);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function uploadCV(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadingCV(true);
    setMessage("");
    setError("");

    try {
      if (cvs.length >= 2) {
        throw new Error(
          "You can upload a maximum of 2 CVs."
        );
      }

      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch("/api/cvs", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to upload CV."
        );
      }

      setCvs((current) => [
        ...current,
        data.cv,
      ]);

      setMessage("CV uploaded successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload CV."
      );
    } finally {
      setUploadingCV(false);
      event.target.value = "";
    }
  }

  async function deleteCV(id: string) {
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/cvs?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to delete CV."
        );
      }

      setCvs((current) =>
        current.filter((cv) => cv.id !== id)
      );

      setMessage("CV deleted.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete CV."
      );
    }
  }

  async function handleSubscription(
    action: "cancel" | "reactivate"
  ) {
    setSubscriptionLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        "/api/subscription",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to update subscription."
        );
      }

      setMessage(
        action === "cancel"
          ? "Your subscription will end at the end of the current billing period."
          : "Your subscription has been reactivated."
      );

      await loadDashboard();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update subscription."
      );
    } finally {
      setSubscriptionLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();

    window.location.href = "/login";
  }

  function formatDate(date: string | null) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  function packageLabel(
    packageType: string
  ) {
    if (packageType === "monthly") return "Monthly";
    if (packageType === "pro") return "Pro";
    if (packageType === "basic") return "Basic";

    return "None";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-slate-600">
            Loading dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-xl font-bold text-blue-600"
          >
            StudentInItaly
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-slate-100"
            >
              Find Jobs
            </Link>

            <button
              onClick={logout}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            {email}
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ACCOUNT SUMMARY */}

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Available applications
            </p>

            <p className="mt-2 text-4xl font-bold text-blue-600">
              {profile?.credits ?? 0}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Each application uses 1 credit.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Current package
            </p>

            <p className="mt-2 text-2xl font-bold">
              {packageLabel(
                profile?.package_type || "none"
              )}
            </p>

            <Link
              href="/pricing"
              className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline"
            >
              Buy applications →
            </Link>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Applications created
            </p>

            <p className="mt-2 text-4xl font-bold">
              {applications.length}
            </p>
          </div>
        </div>

        {/* SUBSCRIPTION */}

        <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Monthly subscription
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                {subscription
                  ? "Monthly plan"
                  : "No active subscription"}
              </h2>

              {subscription ? (
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p>
                    Status:{" "}
                    <span className="font-semibold capitalize">
                      {subscription.status}
                    </span>
                  </p>

                  <p>
                    Next billing period end:{" "}
                    <span className="font-semibold">
                      {formatDate(
                        subscription.current_period_end
                      )}
                    </span>
                  </p>

                  {subscription.cancel_at_period_end && (
                    <p className="font-medium text-orange-600">
                      Cancellation scheduled. Your
                      subscription remains active until
                      the current period ends.
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-600">
                  Get 9 new application credits every
                  month with all Pro features.
                </p>
              )}
            </div>

            <div>
              {!subscription ? (
                <Link
                  href="/pricing"
                  className="inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Choose Monthly
                </Link>
              ) : subscription.cancel_at_period_end ? (
                <button
                  onClick={() =>
                    handleSubscription("reactivate")
                  }
                  disabled={subscriptionLoading}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {subscriptionLoading
                    ? "Updating..."
                    : "Keep subscription"}
                </button>
              ) : (
                <button
                  onClick={() =>
                    handleSubscription("cancel")
                  }
                  disabled={subscriptionLoading}
                  className="rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {subscriptionLoading
                    ? "Updating..."
                    : "Cancel subscription"}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* CVs */}

        <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold">
                Your CVs
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                You can store up to 2 CVs.
              </p>
            </div>

            <label
              className={`cursor-pointer rounded-xl px-5 py-3 text-sm font-semibold ${
                cvs.length >= 2 || uploadingCV
                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {uploadingCV
                ? "Uploading..."
                : "Upload CV"}

              <input
                type="file"
                accept=".pdf,.doc,.docx"
                disabled={
                  cvs.length >= 2 ||
                  uploadingCV
                }
                onChange={uploadCV}
                className="hidden"
              />
            </label>
          </div>

          <div className="mt-6 space-y-3">
            {cvs.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
                No CV uploaded yet. You can upload a
                PDF, DOC or DOCX file.
              </div>
            ) : (
              cvs.map((cv) => (
                <div
                  key={cv.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="font-semibold">
                      {cv.file_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Uploaded{" "}
                      {formatDate(cv.created_at)}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      deleteCV(cv.id)
                    }
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* PROFILE */}

        <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Your profile
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            This information helps StudentInItaly
            personalize your applications.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">
                Full name
              </label>

              <input
                value={form.full_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    full_name: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Phone
              </label>

              <input
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Italian level
              </label>

              <input
                value={form.italian_level}
                onChange={(e) =>
                  setForm({
                    ...form,
                    italian_level: e.target.value,
                  })
                }
                placeholder="A1, A2, B1, B2..."
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                Availability
              </label>

              <input
                value={form.availability}
                onChange={(e) =>
                  setForm({
                    ...form,
                    availability: e.target.value,
                  })
                }
                placeholder="Full-time, weekends..."
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">
                Experience
              </label>

              <textarea
                value={form.experience}
                onChange={(e) =>
                  setForm({
                    ...form,
                    experience: e.target.value,
                  })
                }
                rows={4}
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">
                Skills
              </label>

              <textarea
                value={form.skills}
                onChange={(e) =>
                  setForm({
                    ...form,
                    skills: e.target.value,
                  })
                }
                rows={4}
                placeholder="Customer service, Excel, sales..."
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="mt-6 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {savingProfile
              ? "Saving..."
              : "Save profile"}
          </button>
        </section>

        {/* APPLICATION HISTORY */}

        <section className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">
                Application history
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your previous application records.
              </p>
            </div>

            <Link
              href="/jobs"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Find jobs
            </Link>
          </div>

          <div className="mt-6 space-y-3">
            {applications.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
                You haven't created an application yet.
              </div>
            ) : (
              applications.map((application) => (
                <div
                  key={application.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border p-5 sm:flex-row sm:items-center"
                >
                  <div>
                    <h3 className="font-semibold">
                      {application.job_title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                      {application.company ||
                        "Company not specified"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {application.location ||
                        "Location not specified"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                        {packageLabel(
                          application.package_type
                        )}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize">
                        {application.status}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                        {formatDate(
                          application.created_at
                        )}
                      </span>
                    </div>
                  </div>

                  {application.status !==
                    "expired" && (
                    <Link
                      href={`/apply/result?id=${application.id}`}
                      className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      View application
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}