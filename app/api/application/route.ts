import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/utils/supabase/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const applicationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    whatsapp: {
      type: "string",
    },

    email: {
      type: "object",
      additionalProperties: false,
      properties: {
        subject: {
          type: "string",
        },
        body: {
          type: "string",
        },
      },
      required: ["subject", "body"],
    },

    coverLetter: {
      type: "string",
    },

    interviewPrep: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          question: {
            type: "string",
          },
          answer: {
            type: "string",
          },
        },
        required: ["question", "answer"],
      },
    },

    cv: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: {
          type: "string",
        },
        profile: {
          type: "string",
        },
        experience: {
          type: "string",
        },
        skills: {
          type: "string",
        },
        availability: {
          type: "string",
        },
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
        matchScore: {
          type: "number",
        },

        requirements: {
          type: "array",
          items: {
            type: "string",
          },
        },

        strategy: {
          type: "array",
          items: {
            type: "string",
          },
        },

        checklist: {
          type: "array",
          items: {
            type: "string",
          },
        },

        qualityReport: {
          type: "array",
          items: {
            type: "string",
          },
        },

        advancedInterviewPrep: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              question: {
                type: "string",
              },
              howToAnswer: {
                type: "string",
              },
              mistakeToAvoid: {
                type: "string",
              },
              example: {
                type: "string",
              },
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
  let createdApplicationId: string | null = null;

  try {
    // --------------------------------------------------
    // 1. SUPABASE / AUTH
    // --------------------------------------------------

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // 2. READ REQUEST
    // --------------------------------------------------

    const body = await request.json();

    const {
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
      cvName,
      packageType,
    } = body;

    // --------------------------------------------------
    // 3. VALIDATION
    // --------------------------------------------------

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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "OpenAI API key is not configured.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // 4. GET PROFILE
    // --------------------------------------------------

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Your profile could not be found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 5. CHECK CREDITS
    // --------------------------------------------------

    if (profile.credits < 1) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You don't have any application credits left.",
          code: "NO_CREDITS",
        },
        { status: 402 }
      );
    }

    // --------------------------------------------------
    // 6. PACKAGE
    // --------------------------------------------------

    const allowedPackages = [
      "basic",
      "pro",
      "monthly",
    ];

    const requestedPackage =
      packageType || profile.package_type;

    const finalPackage = allowedPackages.includes(
      requestedPackage
    )
      ? requestedPackage
      : "basic";

    const isPro =
      finalPackage === "pro" ||
      finalPackage === "monthly";

    // --------------------------------------------------
    // 7. BUILD AI PROMPT
    // --------------------------------------------------

    const prompt = `
You are the professional AI application specialist for StudentInItaly.

Create a professional job application package for a candidate applying to a real job in Italy.

IMPORTANT RULES:

- Never invent qualifications.
- Never invent work experience.
- Never invent degrees.
- Never invent certificates.
- Never invent languages.
- Never invent skills.
- Use only information provided by the candidate.
- You may improve wording and structure.
- Write natural professional Italian.
- Make the application specific to the job.
- Do not mention that AI was used.
- Do not make false claims.
- Do not promise that the candidate will get the job.

CANDIDATE

Name:
${name}

Italian level:
${italianLevel}

Experience:
${experience}

Skills:
${skills}

Availability:
${availability}

Existing CV:
${cvName || "No CV uploaded"}

JOB

Position:
${job}

Company:
${company || "Not specified"}

Location:
${location || "Not specified"}

Job URL:
${jobUrl || "Not available"}

Job description:
${description || "No detailed job description available"}

PACKAGE

${isPro ? "PRO / MONTHLY PACKAGE" : "BASIC PACKAGE"}

BASIC PACKAGE MUST INCLUDE:

1. Professional WhatsApp application message.
2. Professional application email.
3. Customized Italian cover letter.
4. Basic interview preparation.
5. CV profile/adaptation content.

PRO / MONTHLY MUST ALSO INCLUDE:

1. Job Match Score from 0 to 100.
2. Job requirements analysis.
3. Personalized application strategy.
4. Application checklist.
5. Application quality report.
6. Advanced interview preparation.

IMPORTANT:

Do NOT create a Missing Skills Analysis.

The Match Score must be based only on the information supplied by the candidate and the job description.

If the job description is incomplete, make that limitation clear in the analysis.

For the CV section, create professional text that can later be converted into a clean DOCX CV.

Use professional Italian suitable for an Italian employer.
`;

    // --------------------------------------------------
    // 8. CALL OPENAI
    // --------------------------------------------------

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
          error: "The AI returned an empty response.",
        },
        { status: 502 }
      );
    }

    // --------------------------------------------------
    // 9. PARSE AI RESULT
    // --------------------------------------------------

    let applicationPack;

    try {
      applicationPack = JSON.parse(
        response.output_text
      );
    } catch (parseError) {
      console.error(
        "OPENAI JSON PARSE ERROR:",
        parseError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "The AI returned an invalid application format.",
        },
        { status: 502 }
      );
    }

    // --------------------------------------------------
    // 10. BASIC USERS DON'T GET PRO ANALYSIS
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 11. SAVE APPLICATION
    // --------------------------------------------------

    const { data: application, error: applicationError } =
      await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          job_id: jobId ? String(jobId) : null,
          job_title: job,
          company: company || null,
          location: location || null,
          job_url: jobUrl || null,
          job_description: description || null,
          package_type: finalPackage,
          credit_used: 1,
          content: applicationPack,
          status: "completed",
        })
        .select()
        .single();

    if (applicationError || !application) {
      console.error(
        "APPLICATION INSERT ERROR:",
        applicationError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Could not save your application.",
        },
        { status: 500 }
      );
    }

    createdApplicationId = application.id;

    // --------------------------------------------------
    // 12. DEDUCT ONE CREDIT SAFELY
    // --------------------------------------------------

    /*
      We update only if the credits value is still the
      same value that we originally read.

      This prevents two simultaneous requests from both
      successfully spending the same credit.
    */

    const expectedCredits = profile.credits;
    const newCredits = expectedCredits - 1;

    const {
      data: updatedProfile,
      error: creditError,
    } = await supabase
      .from("profiles")
      .update({
        credits: newCredits,
      })
      .eq("id", user.id)
      .eq("credits", expectedCredits)
      .select("credits")
      .single();

    if (
      creditError ||
      !updatedProfile
    ) {
      console.error(
        "CREDIT UPDATE ERROR:",
        creditError
      );

      // Remove the application if the credit could not
      // be safely consumed.
      await supabase
        .from("applications")
        .delete()
        .eq("id", createdApplicationId)
        .eq("user_id", user.id);

      return NextResponse.json(
        {
          success: false,
          error:
            "Your application was not charged because your credit could not be reserved. Please try again.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // 13. SUCCESS
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      applicationId: application.id,

      creditsRemaining:
        updatedProfile.credits,

      packageType: finalPackage,

      message:
        "Your application was prepared successfully.",

      applicationPack,
    });
  } catch (error) {
    console.error(
      "APPLICATION API ERROR:",
      error
    );

    /*
      If something unexpected happens after an application
      was created, try to remove it so we don't leave
      incomplete application data behind.
    */

    if (createdApplicationId) {
      try {
        const supabase = await createClient();

        await supabase
          .from("applications")
          .delete()
          .eq("id", createdApplicationId);
      } catch (cleanupError) {
        console.error(
          "APPLICATION CLEANUP ERROR:",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while preparing your application.",
      },
      { status: 500 }
    );
  }
}