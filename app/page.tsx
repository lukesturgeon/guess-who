"use client"

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useAnimalCard } from "../hooks/useAnimalCard";
import { useWebRTC } from "../hooks/useWebRTC";
import { useFFT } from "../hooks/useFFT";

export default function Page() {

  // Audio element for WebRTC
  const audioRef = useRef<HTMLAudioElement>(null);

  // Use FFT hook for voice indicator scaling
  const voiceScale = useFFT(audioRef, { minScale: 1.1, maxScale: 1.4 });

  // WebRTC & AI Chat
  const tools = {
    increaseGuessCount: {
      fn: () => {
        setGuesses((prev) => prev + 1);
        setBlurAmount((prev) => Math.max(prev - BLUR_STEP, MIN_BLUR));
        return { guesses: guesses + 1 };
      },
      description: "Increases the guess count by 1, and returns the total number of guesses so far.",
    },
    endGame: {
      fn: ({ success }: { success: boolean }) => {       
        setEndColor(success ? 'bg-lime-300' : 'bg-rose-300');
        setShowAnimalCard(true);
        setBlurAmount(MIN_BLUR);
        setTimeout(() => {
          stopWebRTCConnection();
        }, 6000);
        return { success: success };
      },
      description: "Ends the game and reveals the correct answer on screen.",
      parameters: {
        type: "object",
        properties: { success: { type: "boolean", description: "Whether the child guessed correctly or not" } },
      },
    },
  };
  const { isConnected, error: webRTCError, startWebRTCConnection, stopWebRTCConnection } = useWebRTC(tools, audioRef);

  // Blur logic
  const INITIAL_BLUR = 20;
  const BLUR_STEP = 4;
  const MIN_BLUR = 0;
  const [blurAmount, setBlurAmount] = useState<number>(INITIAL_BLUR);

  // Game Logic
  const [guesses, setGuesses] = useState(0);
  const [showAnimalCard, setShowAnimalCard] = useState(false);
  const [endColor, setEndColor] = useState<string | null>(null);
  const { selectedCard, error: animalCardError, generateCardWithImage } = useAnimalCard();

  // Image load animation
  const [imageLoaded, setImageLoaded] = useState(false);
  useEffect(() => {
    setImageLoaded(false);
  }, [selectedCard?.image]);

  const handleStart = async () => {
    setGuesses(0);
    setEndColor(null);
    setShowAnimalCard(false);
    setBlurAmount(INITIAL_BLUR);
    const card = generateCardWithImage();
    startWebRTCConnection(card.description);
  };

  const handleStop = () => {
    setShowAnimalCard(true);
    setEndColor('bg-rose-300');
    setBlurAmount(MIN_BLUR);
    stopWebRTCConnection();
  };

  useEffect(() => {
    // Cleanup if needed
    return () => {
      stopWebRTCConnection();
    };
  }, []);


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <audio ref={audioRef} />
      {animalCardError && (
        <div className="my-12 text-red-500 text-center">{animalCardError}</div>
      )}
      {webRTCError && (
        <div className="my-12 text-red-500 text-center">{webRTCError}</div>
      )}
      {selectedCard ? (
        <>
          <div className="w-[512px] h-[512px] relative rounded-full overflow-hidden">
            <div
              className={`absolute top-0 left-0 size-full rounded-full z-0 transition-colors duration-500 pointer-events-none ${endColor ?? 'bg-orange-500'}`}
              style={{
                transform: `scale(${voiceScale})`
              }}
            ></div>
            {selectedCard.image && (
              <Image
                width={512}
                height={512}
                src={selectedCard.image}
                alt={selectedCard.description}
                style={{
                  filter: `blur(${showAnimalCard ? 0 : blurAmount}px)`,
                  opacity: imageLoaded ? 1 : 0
                }}
                className="w-full h-full object-cover rounded-full absolute top-0 left-0 z-10 duration-500 transition-all"
                onLoadingComplete={() => setImageLoaded(true)}
              />
            )}
          </div>
          <div className="text-center">
            <p className="text-3xl mt-6 text-orange-500">{showAnimalCard ? selectedCard.description : "Guess the animal!"}</p>
            <p className="text-lg my-4 text-orange-500">{guesses}/5 Guesses</p>

            {!isConnected && (
              <button
                className="bg-amber-200 px-4 py-2 rounded-full mt-2 text-orange-500"
                onClick={handleStart}
              >
                Play again
              </button>
            )}

            {isConnected && (
              <button
                className="bg-amber-200 px-4 py-2 rounded-full mt-2 text-orange-500"
                onClick={handleStop}
              >
                Stop
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="w-[512px] h-[512px] flex items-center justify-center rounded-full bg-orange-500 animate-pulse cursor-pointer" onClick={handleStart}>
          <span className="text-3xl text-white">Start</span>
        </div>
      )}
    </div>
  );
}
