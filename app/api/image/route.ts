import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(req: NextRequest) {
  const description = req.nextUrl.searchParams.get('description') || '';
  try {
    console.log('Generating image for:', description);
    const result = await openai.images.generate({
      model: 'dall-e-2',
      prompt: description + ', center focus, high energy, japanese animation style',
      n: 1,
      size: '1024x1024',
    });
    if (result.data && Array.isArray(result.data) && result.data.length > 0 && result.data[0].url ) {
      const image = result.data[0].url;
      return NextResponse.json({ image });
    } else {
      throw new Error('Failed to generate image');
    }
  } catch (error) {
    console.error('OpenAI image generation error:', error);
    return NextResponse.json({ image: '/shark.jpg', error: 'Failed to generate image' }, { status: 500 });
  }
}
