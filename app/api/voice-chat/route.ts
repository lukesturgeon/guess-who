import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import { Agent } from '@openai/agents';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const agent = new Agent({ model: 'gpt-4o', apiKey: process.env.OPENAI_API_KEY });

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  // 1. Parse multipart form for audio
  const formData = await req.formData();
  const audioFile = formData.get('audio');
  if (!audioFile || typeof audioFile === 'string') {
    return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
  }

  // 2. Transcribe with Whisper
  let transcript = '';
  try {
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const transcription = await openai.audio.transcriptions.create({
      file: buffer,
      model: 'whisper-1',
      response_format: 'text',
      filename: 'voice.webm',
    } as any);
    transcript = typeof transcription === 'string' ? transcription : transcription.text;
  } catch (e) {
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }

  // 3. Get agent response
  let agentText = '';
  try {
    const result = await agent.run(transcript);
    agentText = result.output;
  } catch (e) {
    return NextResponse.json({ error: 'Agent failed' }, { status: 500 });
  }

  // 4. TTS: synthesize agentText to speech
  let audioUrl = '';
  try {
    const ttsRes = await openai.audio.speech.create({
      model: 'tts-1',
      input: agentText,
      voice: 'nova',
      response_format: 'mp3',
    });
    // Save to /public/voice-tts/voice-<timestamp>.mp3
    const publicDir = path.join(process.cwd(), 'public', 'voice-tts');
    await mkdir(publicDir, { recursive: true });
    const fileName = `voice-${Date.now()}.mp3`;
    const filePath = path.join(publicDir, fileName);
    const fileStream = Readable.fromWeb(ttsRes.body as any);
    const chunks: Buffer[] = [];
    for await (const chunk of fileStream) chunks.push(chunk as Buffer);
    await writeFile(filePath, Buffer.concat(chunks));
    audioUrl = `/voice-tts/${fileName}`;
  } catch (e) {
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }

  return NextResponse.json({ text: agentText, audioUrl });
}
