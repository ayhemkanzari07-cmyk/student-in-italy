import { NextResponse } from "next/server";
import OpenAI from "openai";

import { createClient } from "@/utils/supabase/server";
import { extractCvText } from "@/lib/cv-parser";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_JOB_DESCRIPTION_LENGTH = 20000;

type PackageType = "basic" | "pro" | "monthly";

function isPackageType(value: unknown): value is PackageType {
  return (
    value === "basic" ||
    value === "pro" ||
    value === "monthly"
  );
}

function cleanJobDescription(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, MAX_JOB_DESCRIPTION_LENGTH);
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("id");

    if (!applicationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Application ID is required.",
        },
        { status: 400 }
      );
    }

    const { data: application, error: applicationError } =
      await supabase
        .from("applications")
        .select(
          "id, user_id, job_id, job_title, company, location, job_url, job_description, package_type, credit_used, content, status, created_at, expires_at"
        )
        .eq("id", applicationId)
        .eq("user_id", user.id)
        .single();

    if (applicationError || !application) {
      return NextResponse.json(
        {
          success: false,
          error: "Application not found.",
        },
        { status: 404 }
      );
    }

    const expired =
      application.status === "expired" ||
      (
        application.expires_at &&
        new Date(application.expires_at).getTime() <= Date.now()
      );

    if (expired || !application.content) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This application pack has expired. Generated content is available for 48 hours only.",
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("APPLICATION GET ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Could not load the application.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "You must be logged in.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      jobId,
      jobTitle,
      company,
      location,
      jobUrl,
      jobDescription,
      fullName,
      phone,
      italianLevel,
      experience,
      skills,
      availability,
      cvId,
      packageType,
    } = body;

    if (
      !jobTitle ||
      !company ||
      !location ||
      !fullName ||
      !italianLevel ||
      !availability
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required application information.",
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

    const selectedPackage: PackageType = isPackageType(packageType)
      ? packageType
      : "basic";

    /*
     * ---------------------------------------------------------
     * 1. LOAD USER PROFILE
     * ---------------------------------------------------------
     */

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: "User profile not found.",
        },
        { status: 404 }
      );
    }

    if (!profile.credits || profile.credits < 1) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You don't have enough application credits.",
        },
        { status: 402 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 2. LOAD AND READ CV
     * ---------------------------------------------------------
     */

    let cvText = "";

    if (cvId) {
      const { data: cv, error: cvError } =
        await supabase
          .from("user_cvs")
          .select(
            "id, file_name, file_path, file_type"
          )
          .eq("id", cvId)
          .eq("user_id", user.id)
          .single();

      if (cvError || !cv) {
        return NextResponse.json(
          {
            success: false,
            error: "Selected CV was not found.",
          },
          { status: 404 }
        );
      }

      const { data: cvFile, error: downloadError } =
        await supabase.storage
          .from("cvs")
          .download(cv.file_path);

      if (downloadError || !cvFile) {
        console.error(
          "CV DOWNLOAD ERROR:",
          downloadError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "We couldn't read your CV. Please try uploading it again.",
          },
          { status: 500 }
        );
      }

      const arrayBuffer = await cvFile.arrayBuffer();

      const buffer = Buffer.from(arrayBuffer);

      try {
        cvText = await extractCvText(
          buffer,
          cv.file_name
        );
      } catch (error) {
        console.error(
          "CV EXTRACTION ERROR:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "We couldn't extract text from your CV.",
          },
          { status: 422 }
        );
      }
    }

    /*
     * ---------------------------------------------------------
     * 3. PREPARE JOB INFORMATION
     * ---------------------------------------------------------
     */

    const safeJobDescription =
      cleanJobDescription(jobDescription);

    /*
     * ---------------------------------------------------------
     * 4. BUILD CV CONTEXT
     * ---------------------------------------------------------
     */

    const cvSection = cvText
      ? `
CV DEL CANDIDATO
================

Il testo seguente proviene dal CV caricato dal candidato.

${cvText}

================
FINE CV
`
      : `
CV DEL CANDIDATO
================

Il candidato non ha caricato un CV.

Devi creare la sezione CV partendo esclusivamente
dalle informazioni del profilo fornite sotto.

================
`;

    /*
     * ---------------------------------------------------------
     * 5. PACKAGE FEATURES
     * ---------------------------------------------------------
     */

    const isPro =
      selectedPackage === "pro" ||
      selectedPackage === "monthly";

    const basicInstructions = `
Genera un application pack professionale in italiano.

Deve contenere:

1. WhatsApp message
2. Email con subject e body
3. Cover letter
4. Interview preparation
5. CV adattato alla posizione

Il CV deve essere semplice, professionale e leggibile.

NON inventare esperienze lavorative, aziende,
titoli di studio o competenze che non risultano
dal CV o dal profilo.

Puoi migliorare la formulazione e organizzare
le informazioni esistenti in modo professionale.

Interview preparation:
crea domande realistiche con risposte utili
e coerenti con il profilo del candidato.
`;

    const proInstructions = `
Oltre a tutto ciò che è incluso nel Basic,
aggiungi:

1. Job Match Analysis
   - matchScore da 0 a 100
   - spiegazione sintetica del livello di compatibilità

2. Job Requirements Analysis
   - analizza i requisiti principali dell'offerta

3. Personalized Application Strategy
   - spiega come il candidato dovrebbe presentarsi
   - indica cosa enfatizzare nell'application

4. Application Checklist
   - lista pratica delle cose da controllare prima di inviare la candidatura

5. Application Quality Report
   - valuta la qualità complessiva dell'application
   - indica punti forti
   - indica aspetti da migliorare

6. Advanced Interview Preparation
   - domande realistiche
   - come rispondere
   - cosa enfatizzare
   - errori da evitare
   - esempi di risposta

NON creare una Missing Skills Analysis.

NON creare una sezione separata di frasi italiane.
`;

    /*
     * ---------------------------------------------------------
     * 6. OPENAI PROMPT
     * ---------------------------------------------------------
     */

    const prompt = `
Sei l'AI application assistant di StudentInItaly.

Il tuo compito è aiutare uno studente internazionale
a candidarsi per un lavoro reale in Italia.

TUTTO il contenuto generato deve essere in italiano.

IMPORTANTE:
- Usa il CV reale quando disponibile.
- Non inventare informazioni personali.
- Non inventare esperienze.
- Non inventare aziende.
- Non inventare certificazioni.
- Non inventare competenze.
- Puoi migliorare grammaticalmente le informazioni esistenti.
- Devi adattare il CV e la candidatura all'offerta di lavoro.
- Mantieni un tono professionale ma naturale.
- Considera il livello di italiano dichiarato dal candidato.
- Il candidato potrebbe avere un livello di italiano non perfetto:
  evita formulazioni inutilmente complicate.

========================
INFORMAZIONI CANDIDATO
========================

Nome:
${fullName}

Telefono:
${phone || "Non specificato"}

Livello italiano:
${italianLevel}

Esperienza:
${experience || "Non specificata"}

Competenze:
${skills || "Non specificate"}

Disponibilità:
${availability}

========================
OFFERTA DI LAVORO
========================

Job ID:
${jobId || "Non specificato"}

Posizione:
${jobTitle}

Azienda:
${company}

Località:
${location}

URL:
${jobUrl || "Non specificato"}

Descrizione:
${safeJobDescription || "Non disponibile"}

${cvSection}

========================
ISTRUZIONI PACKAGE
========================

${
  isPro
    ? proInstructions
    : basicInstructions
}

========================
REGOLE FINALI
========================

L'application pack deve essere specificamente
adattato a questa posizione.

Non produrre testo generico.

Il CV deve riflettere il candidato reale.

Se alcune informazioni necessarie non sono presenti,
non inventarle.

Per il CV adattato usa queste sezioni:

- Nome / titolo professionale
- Profilo professionale
- Esperienza
- Competenze
- Disponibilità
- Nota finale se necessaria

Mantieni il CV semplice e professionale.
`;

    /*
     * ---------------------------------------------------------
     * 7. JSON SCHEMA
     * ---------------------------------------------------------
     */

    const schemaProperties: Record<string, unknown> = {
      whatsapp: {
        type: "string",
      },

      email: {
        type: "object",
        properties: {
          subject: {
            type: "string",
          },
          body: {
            type: "string",
          },
        },
        required: ["subject", "body"],
        additionalProperties: false,
      },

      coverLetter: {
        type: "string",
      },

      interviewPrep: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: {
              type: "string",
            },
            answer: {
              type: "string",
            },
          },
          required: ["question", "answer"],
          additionalProperties: false,
        },
      },

      cv: {
        type: "object",
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
          note: {
            type: "string",
          },
        },
        required: [
          "title",
          "profile",
          "experience",
          "skills",
          "availability",
          "note",
        ],
        additionalProperties: false,
      },
    };

    if (isPro) {
      schemaProperties.matchScore = {
        type: "number",
      };

      schemaProperties.matchAnalysis = {
        type: "string",
      };

      schemaProperties.requirements = {
        type: "array",
        items: {
          type: "string",
        },
      };

      schemaProperties.strategy = {
        type: "string",
      };

      schemaProperties.checklist = {
        type: "array",
        items: {
          type: "string",
        },
      };

      schemaProperties.qualityReport = {
        type: "string",
      };

      schemaProperties.advancedInterview = {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: {
              type: "string",
            },
            howToAnswer: {
              type: "string",
            },
            focus: {
              type: "string",
            },
            mistakes: {
              type: "string",
            },
            example: {
              type: "string",
            },
          },
          required: [
            "question",
            "howToAnswer",
            "focus",
            "mistakes",
            "example",
          ],
          additionalProperties: false,
        },
      };
    }

    /*
     * ---------------------------------------------------------
     * 8. GENERATE APPLICATION
     * ---------------------------------------------------------
     */

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",
      store: false,
      input: prompt,
      text: {
        format: {
          type: "json_schema",
          name: "student_in_italy_application",
          strict: true,
          schema: {
            type: "object",
            properties: schemaProperties,
            required: [
              "whatsapp",
              "email",
              "coverLetter",
              "interviewPrep",
              "cv",
              ...(isPro
                ? [
                    "matchScore",
                    "matchAnalysis",
                    "requirements",
                    "strategy",
                    "checklist",
                    "qualityReport",
                    "advancedInterview",
                  ]
                : []),
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const rawOutput = response.output_text;

    if (!rawOutput) {
      return NextResponse.json(
        {
          success: false,
          error: "The AI returned an empty response.",
        },
        { status: 500 }
      );
    }

    let applicationPack: Record<string, unknown>;

    try {
      applicationPack = JSON.parse(rawOutput);
    } catch (error) {
      console.error(
        "AI JSON PARSE ERROR:",
        error,
        rawOutput
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "The AI returned an invalid application pack.",
        },
        { status: 500 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 9. SAVE APPLICATION
     * ---------------------------------------------------------
     */

    const expiresAt = new Date(
      Date.now() + 48 * 60 * 60 * 1000
    ).toISOString();

    const { data: application, error: applicationError } =
      await supabase
        .from("applications")
        .insert({
          user_id: user.id,
          job_id: jobId || null,
          job_title: jobTitle,
          company,
          location,
          job_url: jobUrl || null,
          job_description: safeJobDescription,
          package_type: selectedPackage,
          credit_used: 1,
          content: applicationPack,
          status: "completed",
          expires_at: expiresAt,
        })
        .select("id")
        .single();

    if (applicationError || !application) {
      console.error(
        "APPLICATION INSERT ERROR:",
        applicationError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "The application was generated but could not be saved.",
        },
        { status: 500 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 10. SPEND ONE CREDIT
     * ---------------------------------------------------------
     */

    const expectedCredits = profile.credits;

    const { data: updatedProfile, error: creditError } =
      await supabase
        .from("profiles")
        .update({
          credits: expectedCredits - 1,
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

      await supabase
        .from("applications")
        .delete()
        .eq("id", application.id)
        .eq("user_id", user.id);

      return NextResponse.json(
        {
          success: false,
          error:
            "Your application was not charged because the credit could not be reserved.",
        },
        { status: 409 }
      );
    }

    /*
     * ---------------------------------------------------------
     * 11. RETURN RESULT
     * ---------------------------------------------------------
     */

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      applicationPack,
      creditsRemaining: updatedProfile.credits,
    });
  } catch (error) {
    console.error(
      "APPLICATION API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while creating the application.",
      },
      { status: 500 }
    );
  }
}