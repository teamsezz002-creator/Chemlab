import { Scenario } from './types';

export const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "Basic Lab Orientation",
    intro: "Welcome, Cadet! Before we handle dangerous stuff, let's test your precision. Fill the beaker to exactly 50% capacity.",
    objective: "Fill water to 50%",
    targetWaterLevel: 50,
    quiz: {
      question: "Why do we add water before concentrated acid or active metals?",
      options: [
        "To cool the reaction",
        "To practice valve usage",
        "To dilute the reactant and prevent extreme splashing",
        "It doesn't matter"
      ],
      correctIndex: 2,
      explanation: "Adding the reactant to a large volume of water helps absorb the heat of the reaction more safely."
    }
  },
  {
    id: 2,
    title: "The Alkali Hazard",
    intro: "Sodium is extremely reactive. If we drop it into too much water without a shield, it will explode. Demonstrate its reactivity now.",
    objective: "Add Sodium (Na) to the beaker",
    targetMetalId: "na",
    quiz: {
      question: "Which gas is released when Sodium reacts with water?",
      options: ["Oxygen", "Carbon Dioxide", "Hydrogen", "Nitrogen"],
      correctIndex: 2,
      explanation: "Sodium reacts with water to produce Sodium Hydroxide and Hydrogen gas (2Na + 2H2O -> 2NaOH + H2)."
    }
  },
  {
    id: 3,
    title: "The Mystery Transition",
    intro: "Identify a metal that shows no reaction with cold water but is widely used in electrical wiring.",
    objective: "Add Copper (Cu) to the beaker",
    targetMetalId: "cu",
    quiz: {
      question: "Why does Copper not react with water?",
      options: [
        "It is protected by a plastic coating",
        "It is far below Hydrogen in the reactivity series",
        "It is too heavy",
        "It only reacts with hot milk"
      ],
      correctIndex: 1,
      explanation: "Copper is low in the activity series and cannot displace hydrogen from water."
    }
  }
];
