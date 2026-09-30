"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type Profile = {
  full_name: string | null;
  phone: string | null;
  italian_level: string | null;
  experience: string | null;
  skills: string | null;
  availability: string | null;
  package_type: string;
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
  job_title: string;
  company: string;
  location: string;
  package_type: string;
  status: string;
  created_at: string;
};

export default function DashboardPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [cvs, setCvs] = useState<CV[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadDashboard() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setEmail(user.email ?? "");

    const [profileResponse, cvsResponse] = await Promise.all([
      fetch("/api/profile"),
      fetch("/api/cvs"),
    ]);

    const profileData = await profileResponse.json();
    const cvsData = await cvsResponse.json();

    if (profileData.profile) {
      setProfile(profileData.profile);
    }

    if (cvsData.cvs) {
      setCvs(cvsData.cvs);
    }

    const { data: applicationData } = await supabase
      .from("applications")
      .select(
        "id, job_title, company, location, package_type, status, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(10);

    setApplications(applicationData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) return;

    setSaving(true);
    setMessage("");

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not save profile.");
    } else {
      setProfile(data.profile);
      setMessage("Profile saved successfully.");
    }

    setSaving(false);
  }

  async function uploadCV(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/cvs", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not upload CV.");
    } else {
      setCvs((current) => [data.cv, ...current]);
      setMessage("CV uploaded successfully.");
    }

    event.target.value = "";
    setUploading(false);
  }

  async function deleteCV(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this CV?"
    );

    if (!confirmed) return;

    setMessage("");

    const response = await fetch(`/api/cvs?id=${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Could not delete CV.");
      return;
    }

    setCvs((current) => current.filter((cv) => cv.id !== id));
    setMessage("CV deleted successfully.");
  }

  async function logout() {
    await fetch("/auth/signout", {
      method: "POST",
    });

    window.location.href = "/login";
  }

  if (loading || !profile) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            StudentInItaly
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/jobs"
              className="text-gray-600 hover:text-black"
            >
              Find Jobs
            </Link>

            <button
              onClick={logout}
              className="rounded-lg border px-4 py-2 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Welcome, {profile.full_name || "Student"} 👋
          </h1>
          <p className="text-gray-600 mt-2">{email}</p>
        </div>

        {message && (
          <div className="mb-6 rounded-lg border bg-white px-4 py-3">
            {message}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl border p-6">
            <p className="text-sm text-gray-500">Available Credits</p>
            <p className="text-4xl font-bold mt-2">
              {profile.credits}
            </p>
            <Link
              href="/pricing"
              className="inline-block mt-4 text-sm font-medium underline"
            >
              Buy more applications
            </Link>
          </div>

          <div className="bg-white rounded-2xl border p-6">
            <p className="text-sm text-gray-500">Current Package</p>
            <p className="text-2xl font-bold mt-2 capitalize">
              {profile.package_type}
            </p>
          </div>

          <div className="bg-white rounded-2xl border p-6">
            <p className="text-sm text-gray-500">CVs</p>
            <p className="text-4xl font-bold mt-2">
              {cvs.length}/2
            </p>
          </div>
        </div>

        <section className="bg-white rounded-2xl border p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">My CVs</h2>
              <p className="text-sm text-gray-500 mt-1">
                Upload up to 2 CVs in PDF, DOC or DOCX format.
              </p>
            </div>

            <label
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium ${
                cvs.length >= 2 || uploading
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-black text-white"
              }`}
            >
              {uploading ? "Uploading..." : "Upload CV"}

              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                disabled={cvs.length >= 2 || uploading}
                onChange={uploadCV}
              />
            </label>
          </div>

          {cvs.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-gray-500">
              No CV uploaded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {cvs.map((cv) => (
                <div
                  key={cv.id}
                  className="flex items-center justify-between rounded-xl border p-4"
                >
                  <div>
                    <p className="font-medium">{cv.file_name}</p>
                    <p className="text-sm text-gray-500 uppercase mt-1">
                      {cv.file_type}
                    </p>
                  </div>

                  <button
                    onClick={() => deleteCV(cv.id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border p-6 mb-8">
          <h2 className="text-xl font-bold mb-6">My Profile</h2>

          <form onSubmit={saveProfile} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                value={profile.full_name ?? ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    full_name: e.target.value,
                  })
                }
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Phone
              </label>
              <input
                value={profile.phone ?? ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    phone: e.target.value,
                  })
                }
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Italian Level
              </label>
              <input
                value={profile.italian_level ?? ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    italian_level: e.target.value,
                  })
                }
                placeholder="A2, B1, B2..."
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Experience
              </label>
              <textarea
                value={profile.experience ?? ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    experience: e.target.value,
                  })
                }
                rows={4}
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Skills
              </label>
              <textarea
                value={profile.skills ?? ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    skills: e.target.value,
                  })
                }
                rows={4}
                placeholder="Excel, Photoshop, Customer Service..."
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Availability
              </label>
              <input
                value={profile.availability ?? ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    availability: e.target.value,
                  })
                }
                placeholder="Full-time, Part-time, Weekends..."
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black text-white px-6 py-3 font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-2xl border p-6">
          <h2 className="text-xl font-bold mb-6">
            Application History
          </h2>

          {applications.length === 0 ? (
            <p className="text-gray-500">
              You haven't created any applications yet.
            </p>
          ) : (
            <div className="space-y-3">
              {applications.map((application) => (
                <div
                  key={application.id}
                  className="rounded-xl border p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {application.job_title}
                      </p>
                      <p className="text-gray-600">
                        {application.company}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {application.location}
                      </p>
                    </div>

                    <span className="text-sm capitalize">
                      {application.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}