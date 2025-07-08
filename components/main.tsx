"use client"

type AnimalCard = {
    image: string;
    description: string;
};



import { useState } from "react";

export default function Main() {
    const animalCards: AnimalCard[] = [
        {
            image: '/shark.jpg',
            description: 'A shark jumping out of a plane',
        },
        {
            image: '/cat.jpg',
            description: 'A cat diving under the sea',
        },
    ];

    const pickRandomCard = () => animalCards[Math.floor(Math.random() * animalCards.length)];

    const [showButton, setShowButton] = useState(false);
    const [guesses, setGuesses] = useState(0);
    const [endColor, setEndColor] = useState<string | null>(null);
    const [selectedCard, setSelectedCard] = useState<AnimalCard>(() => pickRandomCard());

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

    const handlePlayAgain = () => {
        setGuesses(0);
        setShowButton(false);
        setEndColor(null);
        setSelectedCard(pickRandomCard());
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <div className="size-96 relative rounded-full" onClick={handleGuess}>
                <div
                    className={`absolute top-0 left-0 size-full rounded-full z-0 animate-pulse-grow transition-colors duration-500 ${guesses === 5 ? endColor : 'bg-gray-300'}`}
                ></div>
                <img
                    src={selectedCard.image}
                    alt={selectedCard.description}
                    className={`w-full h-full object-cover rounded-full absolute top-0 left-0 z-10 transition-opacity duration-500 ${guesses === 5 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
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
        </div>
    );
}
