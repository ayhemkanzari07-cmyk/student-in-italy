"use client";

import { useState } from "react";

type InterviewQuestion = {
  question: string;
  answer: string;
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
};

export default function ResultPage() {
  const [copied, setCopied] = useState("");

  const data =
    typeof window !== "undefined"
      ? sessionStorage.getItem("applicationPack")
      : null;

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            No application found
          </h1>

          <p className="mt-3 text-gray-600">
            Please create an application first.
          </p>

          <a
            href="/jobs"
            className="mt-6 inline-block rounded-full bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
          >
            Find a job →
          </a>
        </div>
      </main>
    );
  }

  const applicationPack: ApplicationPack = JSON.parse(data);

  async function copyText(text: string, section: string) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");

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

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">

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
              {copied === "whatsapp" ? "✓ Copied" : "Copy"}
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
              {copied === "email" ? "✓ Copied" : "Copy"}
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
              {copied === "cover" ? "✓ Copied" : "Copy"}
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
              {copied === "cv" ? "✓ Copied" : "Copy CV"}
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

            <div className="mt-6 rounded-xl bg-white p-4 text-sm text-gray-500">
              {applicationPack.cv.note}
            </div>

          </div>

        </section>

        {/* INTERVIEW */}

        <section className="mb-8 rounded-3xl bg-white p-8 shadow-sm">

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

        {/* BUTTONS */}

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">

          <a
            href="/jobs"
            className="rounded-full border border-gray-300 bg-white px-7 py-3 text-center font-semibold text-gray-900 hover:bg-gray-50"
          >
            Find another job
          </a>

          <a
            href="/apply/form"
            className="rounded-full bg-green-600 px-7 py-3 text-center font-semibold text-white hover:bg-green-700"
          >
            Create another application →
          </a>

        </div>

      </div>
    </main>
  );
}