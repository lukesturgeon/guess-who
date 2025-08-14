# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Guess Who is an AI-powered animal guessing game for children built with Next.js, WebRTC, and OpenAI's Realtime API. The game generates random animal scenarios (e.g., "Lion riding a roller coaster") with DALL-E generated images that are progressively revealed as children make guesses through voice interaction.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server with Turbopack
npm run dev

# Build for production
npm build

# Start production server
npm start

# Run linting
npm run lint
```

## Architecture Overview

### Core Game Flow
1. **Card Generation** (`hooks/useAnimalCard.ts`): Randomly selects animal + scenario combination and fetches AI-generated image
2. **Voice Interaction** (`hooks/useWebRTC.ts`): Establishes WebRTC connection to OpenAI's Realtime API for voice chat
3. **Visual Feedback** (`hooks/useFFT.ts`): Provides voice activity detection with visual scaling effects
4. **Progressive Reveal**: Image starts heavily blurred and becomes clearer with each guess (max 5 guesses)

### Key Components

**Main Page** (`app/page.tsx`):
- Integrates all three custom hooks
- Manages game state (guesses, blur amount, end conditions)
- Provides tools to AI agent: `increaseGuessCount` and `endGame`

**API Routes**:
- `/api/session` - Creates OpenAI Realtime session with game instructions
- `/api/image` - Generates GPT-IMAGE images and stores them in Netlify Blobs (with data URL fallback for local dev)

**Custom Hooks**:
- `useAnimalCard` - Manages animal/scenario generation and image fetching
- `useWebRTC` - Handles voice chat connection to OpenAI Realtime API
- `useFFT` - Provides voice activity detection using Web Audio API

### AI Integration

The game uses OpenAI's Realtime API with two function tools:
- `increaseGuessCount`: Called when child makes a guess, reduces image blur
- `endGame`: Called when child guesses correctly or reaches 5 attempts

AI instructions are configured in `/api/session/route.ts` to act as a guessing game host that only answers questions about the current animal scenario.

### Environment Variables

Required:
- `OPENAI_API_KEY` - For both Realtime API and DALL-E image generation

### Tech Stack Specifics

- **Next.js 15** with App Router and Turbopack for development
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **Fredoka** Google Font for child-friendly typography
- **Image Storage**: Netlify Blobs for generated images in production, base64 data URLs for local development
- **Voice Processing**: Web Audio API with FFT analysis for visual feedback

### File Structure

```
app/
├── api/
│   ├── image/route.ts          # GPT-IMAGE generation with Netlify Blobs storage
│   └── session/route.ts        # OpenAI Realtime session creation
├── layout.tsx                  # Root layout with font configuration  
└── page.tsx                    # Main game component

hooks/
├── useAnimalCard.ts           # Animal scenario and image management
├── useWebRTC.ts               # OpenAI Realtime API integration
└── useFFT.ts                  # Voice activity detection

public/generated/              # Legacy directory (now using Netlify Blobs)
```

The game state is entirely client-side with no database persistence. Each session generates a new animal scenario and fetches a fresh AI image.