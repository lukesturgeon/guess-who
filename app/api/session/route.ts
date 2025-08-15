import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const body = await req.json();
  const description = body.description;
  if (!description) {
    return NextResponse.json({ error: "Missing description" }, { status: 400 });
  }

  const instructions = `You are a guessing game for children.
  Speak with enthusiasm and excitement
  You know the animal and activity, the children do not.
  The animal and activity for this round is: ${description}.
  The children will ask you questions about the animal and activity. 
  Each time the child guesses call the 'increaseGuessCount' tool.
  The child can only guess 5 times, then the game ends.
  Call the 'endGame' tool when the child has guessed 5 times.
  Call the 'endGame' tool when the child guessed correctly.
  You will only answer questions that are about the animal and activity.
  To play again the child must first click the "Stop" button, then the "Play again" button.`;

  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-realtime-preview-2024-12-17",
      instructions,
      voice: "ballad",
    }),
  });

  // gpt-4o-mini-realtime-preview-2024-12-17
  // gpt-4o-realtime-preview-2024-12-17

  const result = await response.json();
  return NextResponse.json({ result });
}
