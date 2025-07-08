"use client"

import Image from "next/image";
import { useState, useEffect } from "react";

type AnimalCard = {
    image: string;
    description: string;
};


// List of 20 animals for the guessing game
const ANIMAL_NAMES = [
    "Elephant",
    "Giraffe",
    "Lion",
    "Tiger",
    "Zebra",
    "Kangaroo",
    "Panda",
    "Penguin",
    "Monkey",
    "Rabbit",
    "Horse",
    "Bear",
    "Fox",
    "Wolf",
    "Deer",
    "Owl",
    "Dolphin",
    "Shark",
    "Crocodile",
    "Flamingo"
];

// List of 20 fun, imaginative scenarios for animals
const ANIMAL_SCENARIOS = [
    "jumping out of an airplane",
    "landing on the moon",
    "riding a skateboard",
    "eating a giant ice cream",
    "playing video games",
    "surfing a huge wave",
    "having a tea party",
    "dancing in a disco",
    "painting a masterpiece",
    "building a sandcastle",
    "playing soccer",
    "flying a kite",
    "reading a book in a library",
    "going on a treasure hunt",
    "baking a cake",
    "singing on stage",
    "exploring a jungle",
    "riding a roller coaster",
    "having a snowball fight",
    "taking selfies with friends"
];

// Generates an AnimalCard with a random animal name
function generateAnimalCard(): AnimalCard {
    const animal = ANIMAL_NAMES[Math.floor(Math.random() * ANIMAL_NAMES.length)];
    const scenario = ANIMAL_SCENARIOS[Math.floor(Math.random() * ANIMAL_SCENARIOS.length)];
    return {
        image: `/shark.jpg`,
        description: `${animal} ${scenario}`
    };
}



export default function Main() {

    const [showButton, setShowButton] = useState(false);
    const [guesses, setGuesses] = useState(0);
    const [endColor, setEndColor] = useState<string | null>(null);
    const [selectedCard, setSelectedCard] = useState<AnimalCard | null>(null);

    const [error, setError] = useState<string | null>(null);

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

    // Generate a card on mount
    useEffect(() => {
        generateCardWithImage();
    }, []);

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
                            className={`bg-gray-300 px-4 py-2 rounded transition-opacity duration-300 ${showButton ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                            onClick={handlePlayAgain}
                        >
                            Play again
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
