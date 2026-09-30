export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("query") || "cameriere";
    const location = searchParams.get("location") || "brescia";

    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;

    console.log("=== ADZUNA ENV CHECK ===");
    console.log({
      hasAppId: Boolean(appId),
      hasAppKey: Boolean(appKey),
      environment: process.env.VERCEL_ENV || "unknown",
    });

    if (!appId || !appKey) {
      return Response.json(
        {
          success: false,
          error: "Adzuna API credentials are missing",
        },
        { status: 500 }
      );
    }

    const url =
      `https://api.adzuna.com/v1/api/jobs/it/search/1` +
      `?app_id=${encodeURIComponent(appId)}` +
      `&app_key=${encodeURIComponent(appKey)}` +
      `&results_per_page=10` +
      `&what=${encodeURIComponent(query)}` +
      `&where=${encodeURIComponent(location)}` +
      `&content-type=application/json`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();

      console.error("=== ADZUNA API ERROR ===");
      console.error(errorText);

      return Response.json(
        {
          success: false,
          error: `Adzuna error: ${errorText}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return Response.json({
      success: true,
      results: data.results || [],
    });
  } catch (error) {
    console.error("=== ADZUNA SERVER ERROR ===");
    console.error(error);

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}