// ramsriprasaath's CODE — AI Utility for Project Insights

export interface AIInsightInput {
  projectName: string;
  description?: string;
  updates?: string[];
  tasks?: { title: string; status: string; assignee?: string | null }[];
}

export async function generateAIInsights(data: AIInsightInput): Promise<string> {
  try {
    // 🔹 1. Construct text prompt
    const prompt = `
You are an AI assistant for an internal project tracking system.
Analyze the given project information and summarize progress, key highlights, and potential blockers.

Project: ${data.projectName}
Description: ${data.description || "N/A"}

Progress Updates:
${data.updates && data.updates.length ? data.updates.map((u) => `• ${u}`).join("\n") : "No recent updates"}

Tasks:
${data.tasks && data.tasks.length
        ? data.tasks
            .map(
              (t) =>
                `• ${t.title} - Status: ${t.status} ${t.assignee ? `(Assigned to ${t.assignee})` : ""}`
            )
            .join("\n")
        : "No tasks available"}
    `;

    // 🔹 2. Call GROQ API (using latest recommended Llama model)
    const modelId = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "system",
            content:
              "You are a concise and insightful AI summarizer. Always return clear and structured summaries with headings: 'Progress Summary', 'Key Highlights', and 'Risks or Blockers'.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    // 🔹 3. Parse response
    const dataRes = await response.json();

    if (!response.ok || !dataRes?.choices?.length) {
      console.error("AI API Error:", dataRes);
      return "⚠️ AI insights could not be generated at this time.";
    }

    const summary = dataRes.choices[0].message?.content?.trim();
    return summary || "⚠️ No insights generated.";
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return "⚠️ Failed to generate AI summary due to network or API issue.";
  }
}
