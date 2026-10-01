"use client";

import { useEffect, useState } from "react";

type InterviewQuestion = {
  question: string;
  answer: string;
};

type AdvancedInterviewQuestion = {
  question: string;
  howToAnswer: string;
  focus: string;
  mistakes: string;
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
    note: string;
  };

  matchScore?: number;
  matchAnalysis?: string;
  requirements?: string[];
  strategy?: string;
  checklist?: string[];
  qualityReport?: string;
  advancedInterview?: AdvancedInterviewQuestion[];
};

type ApplicationResponse = {
  id: string;
  job_title: string;
  company: string;
  location: string;
  package_type: string;
  status: string;
  expires_at: string;
  content: ApplicationPack | null;
};

export default function ResultPage() {
  const [application, setApplication] =
    useState<ApplicationResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [copied, setCopied] = useState("");

  const [downloading, setDownloading] =
    useState("");

  /*
   * ---------------------------------------------------------
   * LOAD APPLICATION
   * ---------------------------------------------------------
   */

  useEffect(() => {
    async function loadApplication() {
      try {
        const params = new URLSearchParams(
          window.location.search
        );

        const applicationId =
          params.get("id");

        if (!applicationId) {
          setError(
            "No application ID was provided."
          );
          setLoading(false);
          return;
        }

        const response =
          await fetch(
            `/api/application?id=${encodeURIComponent(
              applicationId
            )}`
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Could not load your application."
          );
        }

        /*
         * The API may return the application
         * directly or inside "application".
         */

        const loadedApplication =
          data.application || data;

        setApplication(
          loadedApplication
        );

        /*
         * Keep the current sessionStorage
         * behaviour for compatibility.
         */

        if (
          loadedApplication.content
        ) {
          sessionStorage.setItem(
            "applicationPack",
            JSON.stringify(
              loadedApplication.content
            )
          );

          sessionStorage.setItem(
            "applicationId",
            loadedApplication.id
          );
        }
      } catch (error) {
        console.error(
          "APPLICATION LOAD ERROR:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Could not load your application."
        );
      } finally {
        setLoading(false);
      }
    }

    loadApplication();
  }, []);

  /*
   * ---------------------------------------------------------
   * COPY
   * ---------------------------------------------------------
   */

  async function copyText(
    text: string,
    section: string
  ) {
    try {
      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(
          text
        );
      } else {
        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value = text;

        textarea.style.position =
          "fixed";

        textarea.style.left =
          "-9999px";

        textarea.style.top = "0";

        document.body.appendChild(
          textarea
        );

        textarea.focus();

        textarea.select();

        document.execCommand(
          "copy"
        );

        document.body.removeChild(
          textarea
        );
      }

      setCopied(section);

      setTimeout(() => {
        setCopied("");
      }, 2000);
    } catch (error) {
      console.error(
        "COPY ERROR:",
        error
      );

      alert(
        "Copy failed. Please select the text manually and copy it."
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * DOWNLOAD
   * ---------------------------------------------------------
   */

  async function downloadDocument(
    type: "cv" | "cover-letter"
  ) {
    if (!application?.id) {
      return;
    }

    setDownloading(type);

    try {
      const response =
        await fetch(
          `/api/application/download?applicationId=${encodeURIComponent(
            application.id
          )}&type=${type}`
        );

      if (!response.ok) {
        let message =
          "Could not download the document.";

        try {
          const data =
            await response.json();

          if (data.error) {
            message = data.error;
          }
        } catch {
          // Ignore JSON parsing errors
        }

        throw new Error(message);
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        type === "cv"
          ? "StudentInItaly-CV.docx"
          : "StudentInItaly-Cover-Letter.docx";

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      window.URL.revokeObjectURL(
        url
      );
    } catch (error) {
      console.error(
        "DOWNLOAD ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Could not download the document."
      );
    } finally {
      setDownloading("");
    }
  }

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="text-gray-600">
              Loading your application pack...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * ERROR
   * ---------------------------------------------------------
   */

  if (
    error ||
    !application ||
    !application.content
  ) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

            <p className="text-sm font-semibold text-green-600">
              STUDENTINITALY
            </p>

            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              {error
                ? "Application unavailable"
                : "Application expired"}
            </h1>

            <p className="mt-3 text-gray-600">
              {error ||
                "The generated application content is no longer available."}
            </p>

            <a
              href="/jobs"
              className="mt-6 inline-block rounded-full bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
            >
              Find another job →
            </a>

          </div>
        </div>
      </main>
    );
  }

  const applicationPack =
    application.content;

  const isPro =
    application.package_type ===
      "pro" ||
    application.package_type ===
      "monthly";

  /*
   * ---------------------------------------------------------
   * PAGE
   * ---------------------------------------------------------
   */

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
            Everything you need to apply for your job.
          </p>

          <div className="mt-4">

            <p className="font-semibold text-gray-900">
              {application.job_title}
            </p>

            <p className="text-gray-600">
              {application.company}
              {application.location
                ? ` · ${application.location}`
                : ""}
            </p>

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
              {copied ===
              "whatsapp"
                ? "✓ Copied"
                : "Copy"}
            </button>

          </div>

          <div className="mt-6 whitespace-pre-line rounded-2xl bg-gray-50 p-5 text-gray-700">
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

            <div className="mt-4 whitespace-pre-line rounded-2xl bg-gray-50 p-5 text-gray-700">
              {applicationPack.email.body}
            </div>

          </div>

        </section>

        {/* COVER LETTER */}

        <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm font-semibold text-green-600">
                03
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                Cover Letter 📝
              </h2>

            </div>

            <div className="flex flex-wrap gap-2">

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

              <button
                type="button"
                onClick={() =>
                  downloadDocument(
                    "cover-letter"
                  )
                }
                disabled={
                  downloading ===
                  "cover-letter"
                }
                className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloading ===
                "cover-letter"
                  ? "Preparing..."
                  : "↓ Download DOCX"}
              </button>

            </div>

          </div>

          <div className="mt-6 whitespace-pre-line rounded-2xl bg-gray-50 p-5 text-gray-700">
            {applicationPack.coverLetter}
          </div>

        </section>

        {/* CV */}

        <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-sm font-semibold text-green-600">
                04
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                CV adapté 📄
              </h2>

            </div>

            <button
              type="button"
              onClick={() =>
                downloadDocument("cv")
              }
              disabled={
                downloading === "cv"
              }
              className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading === "cv"
                ? "Preparing..."
                : "↓ Download CV DOCX"}
            </button>

          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 p-6">

            <h3 className="text-2xl font-bold text-gray-900">
              {applicationPack.cv.title}
            </h3>

            {applicationPack.cv
              .profile && (
              <div className="mt-6">

                <h4 className="font-bold text-gray-900">
                  Profilo professionale
                </h4>

                <p className="mt-2 whitespace-pre-line text-gray-700">
                  {applicationPack.cv.profile}
                </p>

              </div>
            )}

            {applicationPack.cv
              .experience && (
              <div className="mt-6">

                <h4 className="font-bold text-gray-900">
                  Esperienza
                </h4>

                <p className="mt-2 whitespace-pre-line text-gray-700">
                  {applicationPack.cv.experience}
                </p>

              </div>
            )}

            {applicationPack.cv
              .skills && (
              <div className="mt-6">

                <h4 className="font-bold text-gray-900">
                  Competenze
                </h4>

                <p className="mt-2 whitespace-pre-line text-gray-700">
                  {applicationPack.cv.skills}
                </p>

              </div>
            )}

            {applicationPack.cv
              .availability && (
              <div className="mt-6">

                <h4 className="font-bold text-gray-900">
                  Disponibilità
                </h4>

                <p className="mt-2 whitespace-pre-line text-gray-700">
                  {applicationPack.cv.availability}
                </p>

              </div>
            )}

            {applicationPack.cv
              .note && (
              <div className="mt-6">

                <h4 className="font-bold text-gray-900">
                  Note
                </h4>

                <p className="mt-2 whitespace-pre-line text-gray-700">
                  {applicationPack.cv.note}
                </p>

              </div>
            )}

          </div>

        </section>

        {/* INTERVIEW */}

        <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">

          <div>

            <p className="text-sm font-semibold text-green-600">
              05
            </p>

            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              Interview Preparation 🎤
            </h2>

          </div>

          <div className="mt-6 space-y-4">

            {applicationPack.interviewPrep.map(
              (item, index) => (
                <div
                  key={index}
                  className="rounded-2xl bg-gray-50 p-5"
                >

                  <p className="font-bold text-gray-900">
                    {index + 1}.{" "}
                    {item.question}
                  </p>

                  <p className="mt-3 whitespace-pre-line text-gray-700">
                    {item.answer}
                  </p>

                </div>
              )
            )}

          </div>

        </section>

        {/* PRO FEATURES */}

        {isPro && (
          <>

            {/* MATCH */}

            {typeof applicationPack.matchScore ===
              "number" && (
              <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">

                <p className="text-sm font-semibold text-green-600">
                  PRO
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  Job Match Analysis 🎯
                </h2>

                <div className="mt-6 flex items-center gap-5">

                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-8 border-green-100">

                    <span className="text-2xl font-bold text-green-700">
                      {applicationPack.matchScore}%
                    </span>

                  </div>

                  <p className="flex-1 text-gray-700">
                    {applicationPack.matchAnalysis}
                  </p>

                </div>

              </section>
            )}

            {/* REQUIREMENTS */}

            {applicationPack.requirements &&
              applicationPack.requirements.length >
                0 && (
              <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">

                <h2 className="text-2xl font-bold text-gray-900">
                  Job Requirements
                </h2>

                <ul className="mt-5 space-y-3">

                  {applicationPack.requirements.map(
                    (item, index) => (
                      <li
                        key={index}
                        className="flex gap-3 text-gray-700"
                      >
                        <span className="text-green-600">
                          ✓
                        </span>

                        <span>{item}</span>
                      </li>
                    )
                  )}

                </ul>

              </section>
            )}

            {/* STRATEGY */}

            {applicationPack.strategy && (
              <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">

                <h2 className="text-2xl font-bold text-gray-900">
                  Personalized Application Strategy
                </h2>

                <p className="mt-5 whitespace-pre-line text-gray-700">
                  {applicationPack.strategy}
                </p>

              </section>
            )}

            {/* CHECKLIST */}

            {applicationPack.checklist &&
              applicationPack.checklist.length >
                0 && (
              <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">

                <h2 className="text-2xl font-bold text-gray-900">
                  Application Checklist
                </h2>

                <ul className="mt-5 space-y-3">

                  {applicationPack.checklist.map(
                    (item, index) => (
                      <li
                        key={index}
                        className="flex gap-3 text-gray-700"
                      >
                        <span className="text-green-600">
                          ✓
                        </span>

                        <span>{item}</span>
                      </li>
                    )
                  )}

                </ul>

              </section>
            )}

            {/* QUALITY REPORT */}

            {applicationPack.qualityReport && (
              <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">

                <h2 className="text-2xl font-bold text-gray-900">
                  Application Quality Report
                </h2>

                <p className="mt-5 whitespace-pre-line text-gray-700">
                  {applicationPack.qualityReport}
                </p>

              </section>
            )}

            {/* ADVANCED INTERVIEW */}

            {applicationPack.advancedInterview &&
              applicationPack.advancedInterview
                .length > 0 && (
              <section className="mb-6 rounded-3xl bg-white p-8 shadow-sm">

                <h2 className="text-2xl font-bold text-gray-900">
                  Advanced Interview Preparation
                </h2>

                <div className="mt-6 space-y-5">

                  {applicationPack.advancedInterview.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="rounded-2xl bg-gray-50 p-6"
                      >

                        <p className="font-bold text-gray-900">
                          {index + 1}.{" "}
                          {item.question}
                        </p>

                        <div className="mt-4 space-y-3 text-gray-700">

                          <p>
                            <strong>
                              Come rispondere:
                            </strong>{" "}
                            {item.howToAnswer}
                          </p>

                          <p>
                            <strong>
                              Focus:
                            </strong>{" "}
                            {item.focus}
                          </p>

                          <p>
                            <strong>
                              Errori da evitare:
                            </strong>{" "}
                            {item.mistakes}
                          </p>

                          <p>
                            <strong>
                              Esempio:
                            </strong>{" "}
                            {item.example}
                          </p>

                        </div>

                      </div>
                    )
                  )}

                </div>

              </section>
            )}

          </>
        )}

        {/* EXPIRATION */}

        <div className="mb-8 rounded-2xl bg-yellow-50 p-5 text-center text-sm text-yellow-800">

          Your generated application content is available for
          48 hours.

        </div>

        {/* BACK */}

        <div className="pb-8 text-center">

          <a
            href="/dashboard"
            className="font-semibold text-green-600 hover:underline"
          >
            ← Back to dashboard
          </a>

        </div>

      </div>
    </main>
  );
}