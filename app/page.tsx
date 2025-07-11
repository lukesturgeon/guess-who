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
  const voiceScale = useFFT(audioRef);

  // WebRTC & AI Chat
  const fns = {
    getPageHTML: () => {
      return { success: true, html: document.documentElement.outerHTML };
    },
    changeBackgroundColor: ({ color }: { color: string }) => {
      document.body.style.backgroundColor = color;
      return { success: true, color };
    },
    changeTextColor: ({ color }: { color: string }) => {
      document.body.style.color = color;
      return { success: true, color };
    },

  }
  const { isConnected, error: webRTCError, startWebRTCConnection, stopWebRTCConnection } = useWebRTC(fns, audioRef);


  // Game Logic
  const [guesses, setGuesses] = useState(0);
  const [endColor, setEndColor] = useState<string | null>(null);
  const { selectedCard, error: animalCardError, generateCardWithImage } = useAnimalCard();

  const handleStart = () => {
    setGuesses(0);
    setEndColor(null);
    generateCardWithImage();
    startWebRTCConnection();
  };

  const handleStop = () => {
    stopWebRTCConnection();
  };

  const handleGuess = () => {
    if (guesses < 5) {
      const next = guesses + 1;
      setGuesses(next);
      if (next === 5) {
        setEndColor(Math.random() < 0.5 ? 'bg-rose-300' : 'bg-lime-300');
      }
    }
  };

  useEffect(() => {
    // Cleanup if needed
    return () => {
      stopWebRTCConnection();
    };
  }, []);


  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <audio ref={audioRef} />
      {animalCardError && (
        <div className="font-serif my-12 text-red-500 text-center">{animalCardError}</div>
      )}
      {webRTCError && (
        <div className="font-serif my-12 text-red-500 text-center">{webRTCError}</div>
      )}
      {selectedCard ? (
        <>
          <div className="size-96 relative rounded-full">
            <div
              className={`absolute top-0 left-0 size-full rounded-full z-0 transition-colors duration-500 bg-gray-300 pointer-events-none`}
              style={{
                transform: `scale(${voiceScale})`
              }}
            ></div>
            <Image
              width={384}
              height={384}
              src={selectedCard.image}
              alt={selectedCard.description}
              className={`w-full h-full object-cover rounded-full absolute top-0 left-0 z-10 ${guesses === 5 ? 'opacity-100 transition-opacity duration-500 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            />
          </div>
          <div className="font-serif text-center">
            <p className="font-serif text-3xl my-12">{guesses === 5 ? selectedCard.description : "Guess who?"}</p>
            <p className="text-lg my-4">{guesses}/5 Guesses</p>

            {!isConnected && (
              <button
                className="bg-gray-100 px-4 py-2 rounded mt-4"
                onClick={handleStart}
              >
                Play again
              </button>
            )}

            {isConnected && (
              <button
                className="bg-gray-100 px-4 py-2 rounded mt-4"
                onClick={handleStop}
              >
                Stop
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="size-96 flex items-center justify-center rounded-full bg-gray-300 animate-pulse" onClick={handleStart}>
          <span className="text-xl font-serif" >Start</span>
        </div>
      )}
    </div>
  );
}
