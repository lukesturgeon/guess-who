import { useState } from "react";

export type AnimalCard = {
    image: string | null;
    description: string;
};

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

function generateAnimalCard(): AnimalCard {
    const animal = ANIMAL_NAMES[Math.floor(Math.random() * ANIMAL_NAMES.length)];
    const scenario = ANIMAL_SCENARIOS[Math.floor(Math.random() * ANIMAL_SCENARIOS.length)];
    return {
        image: null,
        description: `${animal} ${scenario}`
    };
}

export function useAnimalCard() {
    const [selectedCard, setSelectedCard] = useState<AnimalCard | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generateCardWithImage = (): AnimalCard => {
        setError(null);

        // Step 1: Generate the card and show immediately with a placeholder image
        const newCard = generateAnimalCard();
        setSelectedCard({ ...newCard });

        // Step 2: Fetch the AI image in the background (non-blocking)
        fetch(`/api/image?description=${encodeURIComponent(newCard.description)}`)
            .then(async res => {
                if (!res.ok) throw new Error('Failed to fetch image');
                const data = await res.json();
                if (!data.image) throw new Error('No image returned');
                setSelectedCard(card => card ? { ...card, image: data.image } : null);
            })
            .catch(err => {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('Unknown error occurred');
                }
            });

        return newCard;
    };

    return {
        selectedCard,
        error,
        generateCardWithImage,
        setSelectedCard,
    };
}
