import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    console.log("=== GENERATE API START ===");

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.log("NO API KEY FOUND");

      return Response.json(
        {
          success: false,
          error: "OPENAI_API_KEY is missing",
        },
        { status: 500 }
      );
    }

    console.log("API KEY FOUND");

    const body = await request.json();

    console.log("REQUEST RECEIVED");

    const {
      job,
      city,
      italianLevel,
      experience,
      jobOffer,
    } = body;

    const client = new OpenAI({
      apiKey: apiKey,
    });

    console.log("CALLING OPENAI...");

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: `
You are an Italian job application assistant.

Create a professional application pack for a foreign student applying for a job in Italy.

Candidate:
Job: ${job}
City: ${city}
Italian level: ${italianLevel}
Experience: ${experience}

Job offer:
${jobOffer}

Create exactly these 3 sections:

1. WHATSAPP MESSAGE
A short natural Italian WhatsApp message to the employer.

2. EMAIL
A professional Italian application email with a subject line.

3. COVER LETTER
A professional Italian cover letter adapted to the candidate.

Important:
- Write everything in Italian.
- Do not invent qualifications or experience.
- Keep the language natural and appropriate for a foreign student.
      `,
    });

    console.log("OPENAI RESPONSE RECEIVED");

    return Response.json({
      success: true,
      result: response.output_text,
    });

  } catch (error) {
    console.error("=== GENERATE API ERROR ===");
    console.error(error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      { status: 500 }
    );
  }
}