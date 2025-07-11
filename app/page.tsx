"use client"

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { AnimalCard, generateAnimalCard } from "../utils/animalCard";

export default function Page() {

  const [showButton, setShowButton] = useState(false);
  const [guesses, setGuesses] = useState(0);
  const [endColor, setEndColor] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<AnimalCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

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

  };

  // Combined function for generating card and fetching image with error handling
  const generateCardWithImage = async () => {
    setError(null);

    // Step 1: Generate the card and show immediately with a placeholder image
    const newCard = generateAnimalCard();
    setSelectedCard({ ...newCard, image: '/cat.jpg' });

    // Step 2: Fetch the AI image in the background
    try {
      const res = await fetch(`/api/image?description=${encodeURIComponent(newCard.description)}`);
      if (!res.ok) throw new Error('Failed to fetch image');
      const data = await res.json();
      if (!data.image) throw new Error('No image returned');
      // Only update the image property, keep the rest of the card
      setSelectedCard(card => card ? { ...card, image: data.image } : null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error occurred');
      }
    }
  };

  const configureData = () => {
    console.log('Configuring data channel');
    if (!dataChannelRef.current) {
      console.warn('Data channel is not available');
      return;
    }
    const event = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        tools: [
          {
            type: 'function',
            name: 'changeBackgroundColor',
            description: 'Changes the background color of a web page',
            parameters: {
              type: 'object',
              properties: {
                color: { type: 'string', description: 'A hex value of the color' },
              },
            },
          },
          {
            type: 'function',
            name: 'changeTextColor',
            description: 'Changes the text color of a web page',
            parameters: {
              type: 'object',
              properties: {
                color: { type: 'string', description: 'A hex value of the color' },
              },
            },
          },
          {
            type: 'function',
            name: 'getPageHTML',
            description: 'Gets the HTML for the current page',
          },
        ],
      },
    };
    dataChannelRef.current.send(JSON.stringify(event));
  }

  // Generate a card on mount
  useEffect(() => {
    generateCardWithImage();
    // Cleanup if needed
    return () => {
      peerConnectionRef.current?.close();
    };
  }, []);

  const [isConnected, setIsConnected] = useState(false);
  const startWebRTCConnection = async () => {
    if (isConnected) return;
    peerConnectionRef.current = new RTCPeerConnection();

    if (peerConnectionRef.current) {
      console.log('peerConnectionRef.current', peerConnectionRef.current);
      peerConnectionRef.current.ontrack = (event) => {
        const el = document.createElement('audio');
        el.srcObject = event.streams[0];
        el.autoplay = true;
        el.controls = true;
        document.body.appendChild(el);
      };

      const dataChannel = peerConnectionRef.current.createDataChannel('oai-events');
      dataChannelRef.current = dataChannel;

      dataChannel.addEventListener('open', (ev) => {
        console.log('Opening data channel', ev);
        configureData();
      });

      dataChannel.addEventListener('message', async (ev) => {
        const msg = JSON.parse(ev.data);
        // Handle function calls
        if (msg.type === 'response.function_call_arguments.done') {
          const fn = fns[msg.name as keyof typeof fns];
          if (fn !== undefined) {
            console.log(`Calling local function ${msg.name} with ${msg.arguments}`);
            const args = JSON.parse(msg.arguments);
            const result = await fn(args);
            console.log('result', result);
            // Let OpenAI know that the function has been called and share it's output
            const event = {
              type: 'conversation.item.create',
              item: {
                type: 'function_call_output',
                call_id: msg.call_id, // call_id from the function_call message
                output: JSON.stringify(result), // result of the function
              },
            };
            dataChannel.send(JSON.stringify(event));
            // Have assistant respond after getting the results
            dataChannel.send(JSON.stringify({ type: "response.create" }));
          }
        }
      });

      // capture the microphone and attach to peer connection
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => peerConnectionRef.current?.addTransceiver(track, { direction: 'sendrecv' }));

        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);

        const tokenResponse = await fetch('/api/session', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await tokenResponse.json();
        const EPHEMERAL_KEY = data.result.client_secret.value;
        const baseUrl = 'https://api.openai.com/v1/realtime';
        const model = 'gpt-4o-realtime-preview-2024-12-17';
        const answer = await fetch(`${baseUrl}?model=${model}`, {
          method: 'POST',
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${EPHEMERAL_KEY}`,
            'Content-Type': 'application/sdp',
          },
        }).then((r) => r.text());
        await peerConnectionRef.current.setRemoteDescription({
          sdp: answer,
          type: 'answer',
        });
        setIsConnected(true);
      } catch (err) {
        setError('Failed to start WebRTC connection');
        console.error(err);
      }
    }
  };


  const handleGuess = () => {
    if (guesses < 5) {
      const next = guesses + 1;
      setGuesses(next);
      if (next === 5) {
        setShowButton(true);
        setEndColor(Math.random() < 0.5 ? 'bg-rose-300' : 'bg-lime-300');
      }
    }
  };

  const handlePlayAgain = async () => {
    setGuesses(0);
    setShowButton(false);
    setEndColor(null);
    await generateCardWithImage();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      {error && (
        <div className="font-serif my-12 text-red-500 text-center">{error}</div>
      )}
      {selectedCard ? (
        <>
          <div className="size-96 relative rounded-full" onClick={handleGuess}>
            <div
              className={`absolute top-0 left-0 size-full rounded-full z-0 animate-pulse-grow transition-colors duration-500 ${guesses === 5 ? endColor : 'bg-gray-300'}`}
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
            <button
              className={`bg-gray-300 px-4 py-2 rounded transition-opacity duration-300 ${showButton ? 'inline' : 'hidden'}`}
              onClick={handlePlayAgain}
            >
              Play again
            </button>
            <button
              className="bg-gray-300 px-4 py-2 rounded mt-4 disabled:opacity-50"
              onClick={startWebRTCConnection}
              disabled={isConnected}
            >
              {isConnected ? "Connected" : "Start"}
            </button>
          </div>
        </>

      ) : (
        <div className="size-96 flex items-center justify-center rounded-full bg-gray-200 animate-pulse">
          <span className="text-xl text-gray-500">Loading...</span>
        </div>
      )}

    </div>
  );
}
