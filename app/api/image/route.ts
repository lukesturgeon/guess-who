import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getStore } from '@netlify/blobs';

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
      
      // Upload to Netlify Blobs
      try {
        const store = getStore('generated-images');
        await store.set(filename, base64Data, {
          metadata: {
            description: description,
            createdAt: new Date().toISOString()
          }
        });
        
        // Construct the public URL for the blob
        const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://localhost:3000';
        const blobUrl = `${siteUrl}/.netlify/blobs/serve/store/generated-images/${filename}`;
        return NextResponse.json({ image: blobUrl });
      } catch (blobError) {
        // Fallback for local development - return base64 data URL
        console.warn('Netlify Blobs not available, using data URL fallback:', blobError);
        const dataUrl = `data:image/png;base64,${base64Data}`;
        return NextResponse.json({ image: dataUrl });
      }
    } else {
      throw new Error('Failed to generate image');
    }
  } catch (error) {
    console.error('OpenAI image generation error:', error);
    return NextResponse.json({ image: '/shark.jpg', error: 'Failed to generate image' }, { status: 500 });
  }
}
