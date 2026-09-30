import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: applications } = await supabase
    .from("applications")
    .select(
      "id, job_title, company, location, package_type, status, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Student";

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Student<span className="text-green-600">InItaly</span>
          </Link>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-full border border-gray-300 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Log out
            </button>
          </form>
        </div>
      </nav>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-600">
            Dashboard
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            Welcome, {displayName} 👋
          </h1>

          <p className="mt-2 text-gray-600">
            Manage your applications and account.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Available credits</p>
              <p className="mt-2 text-4xl font-bold text-gray-900">
                {profile?.credits ?? 0}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Applications remaining
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Current package</p>
              <p className="mt-2 text-2xl font-bold capitalize text-gray-900">
                {profile?.package_type || "None"}
              </p>
            </div>

            <div className="rounded-2xl bg-green-600 p-6 text-white shadow-sm">
              <p className="text-sm text-green-100">
                Need more applications?
              </p>

              <p className="mt-2 text-2xl font-bold">
                Choose a package
              </p>

              <Link
                href="/pricing"
                className="mt-4 inline-block rounded-full bg-white px-5 py-2.5 font-semibold text-green-700"
              >
                View packages
              </Link>
            </div>
          </div>

          <div className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Your applications
                </h2>
                <p className="mt-1 text-gray-600">
                  Your recent application history.
                </p>
              </div>

              <Link
                href="/jobs"
                className="rounded-full bg-green-600 px-5 py-3 text-center font-semibold text-white hover:bg-green-700"
              >
                Find a job →
              </Link>
            </div>

            <div className="mt-8">
              {!applications || applications.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 p-8 text-center">
                  <p className="font-semibold text-gray-900">
                    No applications yet
                  </p>
                  <p className="mt-2 text-gray-600">
                    Find a job and create your first application.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div
                      key={application.id}
                      className="rounded-2xl border border-gray-200 p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 md:flex-row">
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {application.job_title}
                          </h3>

                          {application.company && (
                            <p className="mt-1 text-gray-600">
                              {application.company}
                            </p>
                          )}

                          {application.location && (
                            <p className="mt-1 text-sm text-gray-500">
                              📍 {application.location}
                            </p>
                          )}
                        </div>

                        <div className="text-sm text-gray-500">
                          {new Date(
                            application.created_at
                          ).toLocaleDateString("en-GB")}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize text-gray-700">
                          {application.package_type}
                        </span>

                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold capitalize text-green-700">
                          {application.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}