export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    // Query Gemini REST API directly to list models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Filter models that support generateContent
    const contentModels = data.models.filter((model) =>
      model.supportedGenerationMethods?.includes("generateContent"),
    );

    console.log("📋 Available Gemini models that support generateContent:");
    contentModels.forEach((m) => {
      console.log(`  ✅ ${m.name}`);
      console.log(`     Display: ${m.displayName}`);
      console.log(`     Methods: ${m.supportedGenerationMethods.join(", ")}`);
    });

    return new Response(
      JSON.stringify(
        {
          totalModels: data.models.length,
          contentGenerationModels: contentModels.length,
          models: contentModels.map((m) => ({
            name: m.name,
            displayName: m.displayName,
            methods: m.supportedGenerationMethods,
          })),
        },
        null,
        2,
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("❌ Error listing models:", error.message);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
