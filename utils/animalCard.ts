export type AnimalCard = {
    image: string;
    description: string;
};

export const ANIMAL_NAMES = [
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

export const ANIMAL_SCENARIOS = [
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

export function generateAnimalCard(): AnimalCard {
    const animal = ANIMAL_NAMES[Math.floor(Math.random() * ANIMAL_NAMES.length)];
    const scenario = ANIMAL_SCENARIOS[Math.floor(Math.random() * ANIMAL_SCENARIOS.length)];
    return {
        image: `/shark.jpg`,
        description: `${animal} ${scenario}`
    };
}
