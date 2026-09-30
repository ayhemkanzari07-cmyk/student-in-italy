import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const applicationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    whatsapp: { type: "string" },
    email: {
      type: "object",
      additionalProperties: false,
      properties: {
        subject: { type: "string" },
        body: { type: "string" },
      },
      required: ["subject", "body"],
    },
    coverLetter: { type: "string" },
    interviewPrep: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "answer"],
      },
    },
    cv: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string" },
        profile: { type: "string" },
        experience: { type: "string" },
        skills: { type: "string" },
        availability: { type: "string" },
      },
      required: [
        "title",
        "profile",
        "experience",
        "skills",
        "availability",
      ],
    },
    proAnalysis: {
      type: "object",
      additionalProperties: false,
      properties: {
        matchScore: { type: "number" },
        requirements: {
          type: "array",
          items: { type: "string" },
        },
        strategy: {
          type: "array",
          items: { type: "string" },
        },
        checklist: {
          type: "array",
          items: { type: "string" },
        },
        qualityReport: {
          type: "array",
          items: { type: "string" },
        },
        advancedInterviewPrep: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              question: { type: "string" },
              howToAnswer: { type: "string" },
              mistakeToAvoid: { type: "string" },
              example: { type: "string" },
            },
            required: [
              "question",
              "howToAnswer",
              "mistakeToAvoid",
              "example",
            ],
          },
        },
      },
      required: [
        "matchScore",
        "requirements",
        "strategy",
        "checklist",
        "qualityReport",
        "advancedInterviewPrep",
      ],
    },
  },
  required: [
    "whatsapp",
    "email",
    "coverLetter",
    "interviewPrep",
    "cv",
    "proAnalysis",
  ],
} as const;

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "OpenAI API key is not configured.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const {
      job,
      company,
      location,
      description,
      name,
      italianLevel,
      experience,
      skills,
      availability,
      cvName,
      packageType = "basic",
    } = body;

    if (
      !job ||
      !name ||
      !italianLevel ||
      !experience ||
      !skills ||
      !availability
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please complete all required fields.",
        },
        { status: 400 }
      );
    }

    const isPro =
      packageType === "pro" || packageType === "monthly";

    const prompt = `
You are the AI application specialist for StudentInItaly.

Your task is to create a professional Italian job application pack for an international student applying for a real job in Italy.

IMPORTANT RULES:
- Never invent qualifications, jobs, degrees, certificates, skills or experience.
- Use only the candidate information provided.
- Improve wording and presentation, but do not fabricate facts.
- Write natural, professional Italian.
- Keep the application realistic for the Italian job market.
- Do not mention that AI was used.
- Do not promise employment.
- If information is missing, work with what is available.
- The candidate may have limited Italian proficiency, so keep language natural and appropriate.

CANDIDATE:
Name: ${name}
Italian level: ${italianLevel}
Experience:
${experience}

Skills:
${skills}

Availability:
${availability}

CV file:
${cvName || "No CV uploaded"}

JOB:
Position: ${job}
Company: ${company || "Not specified"}
Location: ${location || "Not specified"}

Job description:
${description || "No detailed job description available."}

PACKAGE:
${isPro ? "PRO / MONTHLY — generate all advanced analysis." : "BASIC — generate the standard application pack."}

For the standard application:
1. WhatsApp message
2. Professional application email
3. Customized cover letter
4. Basic interview preparation
5. CV profile/adaptation content

For Pro/Monthly:
Also provide:
1. Match score from 0 to 100 based only on the candidate information and job description.
2. Job requirements analysis.
3. Personalized application strategy.
4. Application checklist.
5. Application quality report.
6. Advanced interview preparation with how to answer, mistakes to avoid and examples.

Do NOT provide a Missing Skills Analysis.
Do NOT invent missing qualifications.
`;

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",
      store: false,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "student_in_italy_application",
          strict: true,
          schema: applicationSchema,
        },
      },
    });

    if (!response.output_text) {
      return NextResponse.json(
        {
          success: false,
          error: "OpenAI returned an empty response.",
        },
        { status: 502 }
      );
    }

    const applicationPack = JSON.parse(response.output_text);

    if (!isPro) {
      applicationPack.proAnalysis = {
        matchScore: 0,
        requirements: [],
        strategy: [],
        checklist: [],
        qualityReport: [],
        advancedInterviewPrep: [],
      };
    }

    return NextResponse.json({
      success: true,
      applicationPack,
    });
  } catch (error) {
    console.error("OPENAI GENERATION ERROR:", error);

    const message =
      error instanceof Error
        ? error.message
        : "AI generation failed.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}