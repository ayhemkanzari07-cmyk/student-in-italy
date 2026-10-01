"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

type InterviewQuestion = {
  question: string;
  answer: string;
};

type AdvancedInterviewQuestion = {
  question: string;
  howToAnswer: string;
  mistakeToAvoid: string;
  example: string;
};

type ApplicationPack = {
  whatsapp: string;

  email: {
    subject: string;
    body: string;
  };

  coverLetter: string;

  interviewPrep: InterviewQuestion[];

  cv: {
    title: string;
    profile: string;
    experience: string;
    skills: string;
    availability: string;
  };

  proAnalysis?: {
    matchScore: number;
    requirements: string[];
    strategy: string[];
    checklist: string[];
    qualityReport: string[];
    advancedInterviewPrep: AdvancedInterviewQuestion[];
  };
};

type Application = {
  id: string;
  job_title: string;
  company: string | null;
  location: string | null;
  package_type: string;
  status: string;
  content: ApplicationPack;
  created_at: string;
  expires_at: string;
};

function ResultContent() {
  const searchParams = useSearchParams();
  const queryApplicationId = searchParams.get("id");

  const [application, setApplication] =
    useState<Application | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    async function loadApplication() {
      /*
       * The normal path uses ?id=...
       * We also keep a fallback to sessionStorage because the
       * form already saves applicationId there before redirecting.
       */
      const storedApplicationId =
        sessionStorage.getItem("applicationId");

      const applicationId =
        queryApplicationId || storedApplicationId;

      if (!applicationId) {
        setError("No application ID was provided.");
        setLoading(false);
        return;
      }

      /*
       * If the URL arrived without ?id=..., repair the URL so
       * refresh/back/forward navigation keeps the application ID.
       */
      if (!queryApplicationId) {
        window.history.replaceState(
          null,
          "",
          `/apply/result?id=${encodeURIComponent(applicationId)}`
        );
      }

      try {
        const response = await fetch(
          `/api/application?id=${encodeURIComponent(applicationId)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent(
            `/apply/result?id=${applicationId}`
          )}`;
          return;
        }

        if (!response.ok || !data.success || !data.application) {
          console.error("APPLICATION LOAD ERROR:", data);

          setError(
            data.error ||
              "This application could not be found or is no longer available."
          );

          setLoading(false);
          return;
        }

        setApplication(data.application as Application);
      } catch (error) {
        console.error("APPLICATION LOAD ERROR:", error);

        setError(
          "We couldn't load your application. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadApplication();
  }, [queryApplicationId]);

  async function copyText(
    text: string,
    section: string
  ) {
    try {
      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea =
          document.createElement("textarea");

        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "0";

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        document.execCommand("copy");

        document.body.removeChild(textarea);
      }

      setCopied(section);

      setTimeout(() => {
        setCopied("");
      }, 2000);
    } catch (error) {
      console.error("COPY ERROR:", error);

      alert(
        "Copy failed. Please select the text manually and copy it."
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="text-gray-600">
            Loading your application...
          </p>
        </div>
      </main>
    );
  }

  if (error || !application) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Application unavailable
          </h1>

          <p className="mt-3 text-gray-600">
            {error ||
              "This application could not be loaded."}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/jobs"
              className="rounded-full bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
            >
              Find a job →
            </Link>

            <Link
              href="/dashboard"
              className="rounded-full border border-gray-300 px-6 py-3 font-semibold text-gray-900 hover:bg-gray-50"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const applicationPack = application.content;

  const isPro =
    application.package_type === "pro" ||
    application.package_type === "monthly";

  const proAnalysis = applicationPack.proAnalysis;

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* HEADER */}

        <div className="mb-10 text-center">
          <p className="text-sm font-semibold text-green-600">
            STUDENTINITALY
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            Your application pack is ready 🎉
          </h1>

          <p className="mt-3 text-gray-600">
            Everything you need to apply for this job.
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-gray-200 px-4 py-2 text-sm font-semibold capitalize text-gray-700">
              {application.package_type} package
            </span>

            {application.company && (
              <span className="rounded-full bg-gray-200 px-4 py-2 text-sm text-gray-700">
                {application.company}
              </span>
            )}

            {application.location && (
              <span className="rounded-full bg-gray-200 px-4 py-2 text-sm text-gray-700">
                📍 {application.location}
              </span>
            )}
          </div>
        </div>

        {/* WHATSAPP */}

        <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-green-600">
                01
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                WhatsApp message 📱
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                copyText(
                  applicationPack.whatsapp,
                  "whatsapp"
                )
              }
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              {copied === "whatsapp"
                ? "✓ Copied"
                : "Copy"}
            </button>
          </div>

          <div className="mt-6 rounded-2xl bg-gray-50 p-5 whitespace-pre-line text-gray-700">
            {applicationPack.whatsapp}
          </div>
        </section>

        {/* EMAIL */}

        <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-green-600">
                02
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                Email 📧
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                copyText(
                  `Subject: ${applicationPack.email.subject}\n\n${applicationPack.email.body}`,
                  "email"
                )
              }
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              {copied === "email"
                ? "✓ Copied"
                : "Copy"}
            </button>
          </div>

          <div className="mt-6">
            <div className="rounded-xl bg-gray-100 p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Subject
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {applicationPack.email.subject}
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-gray-50 p-5 whitespace-pre-line text-gray-700">
              {applicationPack.email.body}
            </div>
          </div>
        </section>

        {/* COVER LETTER */}

        <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-green-600">
                03
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                Cover letter 📄
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                copyText(
                  applicationPack.coverLetter,
                  "cover"
                )
              }
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              {copied === "cover"
                ? "✓ Copied"
                : "Copy"}
            </button>
          </div>

          <div className="mt-6 rounded-2xl bg-gray-50 p-5 whitespace-pre-line text-gray-700">
            {applicationPack.coverLetter}
          </div>
        </section>

        {/* CV */}

        <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-green-600">
                04
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                CV profile 📋
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                copyText(
                  `${applicationPack.cv.title}

PROFILE
${applicationPack.cv.profile}

EXPERIENCE
${applicationPack.cv.experience}

SKILLS
${applicationPack.cv.skills}

AVAILABILITY
${applicationPack.cv.availability}`,
                  "cv"
                )
              }
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              {copied === "cv"
                ? "✓ Copied"
                : "Copy CV"}
            </button>
          </div>

          <div className="mt-6 rounded-2xl bg-gray-50 p-6">
            <h3 className="text-xl font-bold text-gray-900">
              {applicationPack.cv.title}
            </h3>

            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-500">
                PROFILE
              </p>

              <p className="mt-2 whitespace-pre-line text-gray-700">
                {applicationPack.cv.profile}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-500">
                EXPERIENCE
              </p>

              <p className="mt-2 whitespace-pre-line text-gray-700">
                {applicationPack.cv.experience}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-500">
                SKILLS
              </p>

              <p className="mt-2 whitespace-pre-line text-gray-700">
                {applicationPack.cv.skills}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-500">
                AVAILABILITY
              </p>

              <p className="mt-2 text-gray-700">
                {applicationPack.cv.availability}
              </p>
            </div>
          </div>
        </section>

        {/* INTERVIEW */}

        <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-green-600">
              05
            </p>

            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              Interview preparation 🎤
            </h2>
          </div>

          <div className="mt-6 space-y-5">
            {applicationPack.interviewPrep.map(
              (item, index) => (
                <div
                  key={index}
                  className="rounded-2xl bg-gray-50 p-5"
                >
                  <p className="font-bold text-gray-900">
                    {index + 1}. {item.question}
                  </p>

                  <p className="mt-3 whitespace-pre-line text-gray-600">
                    {item.answer}
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        {/* PRO ANALYSIS */}

        {isPro && proAnalysis && (
          <>
            {/* MATCH SCORE */}

            <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold text-green-600">
                PRO ANALYSIS
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                Job Match Analysis 🎯
              </h2>

              <div className="mt-6 flex flex-col items-center rounded-2xl bg-gray-50 p-8">
                <p className="text-sm font-semibold text-gray-500">
                  MATCH SCORE
                </p>

                <p className="mt-2 text-6xl font-bold text-gray-900">
                  {Math.round(proAnalysis.matchScore)}%
                </p>

                <p className="mt-3 max-w-xl text-center text-sm text-gray-500">
                  This score is based on the information
                  provided about the candidate and the job.
                </p>
              </div>
            </section>

            {/* REQUIREMENTS */}

            <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">
                Job requirements analysis
              </h2>

              <div className="mt-6 space-y-3">
                {proAnalysis.requirements.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="rounded-xl bg-gray-50 p-4 text-gray-700"
                    >
                      {item}
                    </div>
                  )
                )}
              </div>
            </section>

            {/* STRATEGY */}

            <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">
                Personalized application strategy
              </h2>

              <div className="mt-6 space-y-3">
                {proAnalysis.strategy.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="rounded-xl bg-gray-50 p-4 text-gray-700"
                    >
                      <span className="font-semibold">
                        {index + 1}.
                      </span>{" "}
                      {item}
                    </div>
                  )
                )}
              </div>
            </section>

            {/* CHECKLIST */}

            <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">
                Application checklist
              </h2>

              <div className="mt-6 space-y-3">
                {proAnalysis.checklist.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex gap-3 rounded-xl bg-gray-50 p-4 text-gray-700"
                    >
                      <span>☐</span>
                      <span>{item}</span>
                    </div>
                  )
                )}
              </div>
            </section>

            {/* QUALITY REPORT */}

            <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">
                Application quality report
              </h2>

              <div className="mt-6 space-y-3">
                {proAnalysis.qualityReport.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="rounded-xl bg-gray-50 p-4 text-gray-700"
                    >
                      {item}
                    </div>
                  )
                )}
              </div>
            </section>

            {/* ADVANCED INTERVIEW */}

            <section className="mb-8 rounded-3xl bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">
                Advanced interview preparation 🚀
              </h2>

              <div className="mt-6 space-y-5">
                {proAnalysis.advancedInterviewPrep.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="rounded-2xl bg-gray-50 p-5"
                    >
                      <p className="font-bold text-gray-900">
                        {index + 1}. {item.question}
                      </p>

                      <div className="mt-4 space-y-3 text-gray-700">
                        <p>
                          <strong>
                            How to answer:
                          </strong>{" "}
                          {item.howToAnswer}
                        </p>

                        <p>
                          <strong>
                            Mistake to avoid:
                          </strong>{" "}
                          {item.mistakeToAvoid}
                        </p>

                        <p>
                          <strong>Example:</strong>{" "}
                          {item.example}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
          </>
        )}

        {/* FOOTER BUTTONS */}

        <div className="flex flex-col gap-4 pb-8 sm:flex-row sm:justify-center">
          <Link
            href="/jobs"
            className="rounded-full border border-gray-300 bg-white px-7 py-3 text-center font-semibold text-gray-900 hover:bg-gray-50"
          >
            Find another job
          </Link>

          <Link
            href="/dashboard"
            className="rounded-full bg-black px-7 py-3 text-center font-semibold text-white hover:bg-gray-800"
          >
            Go to dashboard →
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gray-50 px-6 py-12">
          <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 text-center">
            Loading...
          </div>
        </main>
      }
    >
      <ResultContent />
    </Suspense>
  );
}