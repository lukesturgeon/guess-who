import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(req: NextRequest) {
  const description = req.nextUrl.searchParams.get('description')?.toLowerCase().trim() || '';
  try {
    const result = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: `Generate a photorealistic image of a cute ${description}. 
      Place the animal in the center of the image.
      Exagerate the expressions of the animal, but ensure it is still photorealistic.`,
      n: 1,
      size: '1024x1024',
      quality: 'low',
    });

    if (result.data && Array.isArray(result.data) && result.data.length > 0 && result.data[0].b64_json) {
      const base64Data = result.data[0].b64_json;
      
      // Create a unique filename based on description
      const filename = `${description.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
      const publicDir = path.join(process.cwd(), 'public', 'generated');
      
      // Ensure the generated directory exists
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      const filePath = path.join(publicDir, filename);
      
      // Write the base64 data to a file
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
      
      // Return the local path to the saved image
      const imageUrl = `/generated/${filename}`;
      return NextResponse.json({ image: imageUrl });
    } else {
      throw new Error('Failed to generate image');
    }
  } catch (error) {
    console.error('OpenAI image generation error:', error);
    return NextResponse.json({ image: '/shark.jpg', error: 'Failed to generate image' }, { status: 500 });
  }
}
