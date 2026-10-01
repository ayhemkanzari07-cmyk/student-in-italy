"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const plans = [
  {
    name: "Basic",
    price: "€7.90",
    subtitle: "For students who need a few applications",
    applications: "2 applications",
    features: [
      "CV adaptation",
      "Professional cover letter",
      "Email application",
      "WhatsApp application message",
      "Interview preparation",
    ],
  },
  {
    name: "Pro",
    price: "€12.90",
    subtitle: "More powerful applications with advanced analysis",
    applications: "3 applications",
    popular: true,
    features: [
      "Everything in Basic",
      "Job Match Score (0–100%)",
      "Job requirements analysis",
      "Personalized application strategy",
      "Advanced interview preparation",
      "Application checklist",
      "Application quality report",
    ],
  },
  {
    name: "Monthly",
    price: "€27.90",
    subtitle: "For students applying regularly",
    applications: "+9 applications every month",
    features: [
      "All Pro features",
      "9 new applications every month",
      "Unused credits accumulate",
      "Cancel anytime",
      "Existing credits remain after cancellation",
    ],
  },
];

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState("");

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setLoading(false);
    }

    loadUser();
  }, []);

  async function handleCheckout(planName: string) {
    if (!user) {
      window.location.href = `/login?redirect=/pricing`;
      return;
    }

    setCheckoutLoading(planName);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: planName.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Could not start checkout."
        );
      }

      if (!data.url) {
        throw new Error(
          "Stripe checkout URL was not returned."
        );
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("CHECKOUT ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong with checkout."
      );

      setCheckoutLoading("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-blue-600"
          >
            StudentInItaly
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-slate-100"
                >
                  Log in
                </Link>

                <Link
                  href="/signup"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
              Simple pricing
            </p>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Choose your application package
            </h1>

            <p className="mt-4 text-lg text-slate-600">
              Get professional, AI-powered application materials for real jobs
              in Italy.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCheckingOut =
                checkoutLoading === plan.name;

              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-3xl border bg-white p-7 shadow-sm ${
                    plan.popular
                      ? "border-blue-600 shadow-lg"
                      : "border-slate-200"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-bold text-white">
                      MOST FEATURES
                    </div>
                  )}

                  <div>
                    <h2 className="text-2xl font-bold">
                      {plan.name}
                    </h2>

                    <p className="mt-2 min-h-[48px] text-sm text-slate-500">
                      {plan.subtitle}
                    </p>
                  </div>

                  <div className="mt-6">
                    <span className="text-4xl font-bold">
                      {plan.price}
                    </span>

                    {plan.name === "Monthly" && (
                      <span className="ml-2 text-sm text-slate-500">
                        / month
                      </span>
                    )}
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">
                      {plan.applications}
                    </p>
                  </div>

                  <div className="my-7 h-px bg-slate-200" />

                  <ul className="flex-1 space-y-4">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 text-sm text-slate-700"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                          ✓
                        </span>

                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={loading || isCheckingOut}
                    onClick={() =>
                      handleCheckout(plan.name)
                    }
                    className={`mt-8 w-full rounded-2xl px-5 py-3.5 font-semibold transition ${
                      plan.popular
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {loading
                      ? "Loading..."
                      : isCheckingOut
                      ? "Redirecting to Stripe..."
                      : "Choose " + plan.name}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-sm leading-6 text-slate-600">
              Your applications are prepared for you by AI. Credits are used
              when you generate an application. Monthly subscription credits
              are added every month and unused credits accumulate.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}