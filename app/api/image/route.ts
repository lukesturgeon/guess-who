import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getStore } from '@netlify/blobs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(req: NextRequest) {
  const description = req.nextUrl.searchParams.get('description')?.toLowerCase().trim() || '';
  
  // Create a consistent filename based on description only (for caching)
  const cacheKey = `${description.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  // Try to get cached image first
  try {
    const store = getStore('generated-images');
    const cachedImage = await store.get(cacheKey, { type: 'text' });
    
    if (cachedImage) {
      console.log('Returning cached image from Netlify Blobs');
      const dataUrl = `data:image/png;base64,${cachedImage}`;
      return NextResponse.json({ image: dataUrl });
    }
  } catch (cacheError) {
    console.log('Cache miss or Netlify Blobs not available, generating new image:', String(cacheError));
  }
  
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
      
      // Try to store in Netlify Blobs for future caching, but always return data URL
      try {
        const store = getStore('generated-images');
        await store.set(cacheKey, base64Data, {
          metadata: {
            description: description,
            createdAt: new Date().toISOString()
          }
        });
        console.log('Image stored in Netlify Blobs for caching');
      } catch (blobError) {
        console.warn('Netlify Blobs not available, skipping cache:', blobError);
      }
      
      // Always return data URL (works everywhere)
      const dataUrl = `data:image/png;base64,${base64Data}`;
      return NextResponse.json({ image: dataUrl });
    } else {
      throw new Error('Failed to generate image');
    }
  } catch (error) {
    console.error('OpenAI image generation error:', error);
    return NextResponse.json({ image: '/shark.png', error: 'Failed to generate image' }, { status: 500 });
  }
}
