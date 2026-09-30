export async function POST(request: Request) {
  try {
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
    } = body;

    console.log("=== APPLICATION RECEIVED ===");

    console.log({
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
    });

    return Response.json({
      success: true,
      message:
        "Your application information was received successfully. AI generation will be connected next.",
    });
  } catch (error) {
    console.error("APPLICATION API ERROR:", error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}