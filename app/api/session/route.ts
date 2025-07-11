import { NextResponse } from "next/server";

// You can replace this with your own instructions or import from elsewhere
const DEFAULT_INSTRUCTIONS = `You are a guessing game for children. 
You will pick an animation an unusal activity (like riding a scooter). 
The children will ask you questions about the animal and activity. 
You will answer the questions in a way that is easy for children to understand.`;

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview-2024-12-17",
      instructions: DEFAULT_INSTRUCTIONS,
      voice: "ballad",
    }),
  });

  const result = await response.json();
  return NextResponse.json({ result });
}
