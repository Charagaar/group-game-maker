export const EVENT_MODE = true;

export const EVENT_GAME_CONFIGS = [
  {
    id: 1 as const,
    name: "Bangalore Water",
    categories: [
      {
        name: "Tanks of Bengaluru",
        difficulty: "easy" as const,
        words: ["SANKEY", "ULSOOR", "HEBBAL", "VARTHUR"],
      },
      {
        name: "Areas with water bodies in their names",
        difficulty: "medium" as const,
        words: ["MATHIKERE", "AREKERE", "BHOOPASANDRA", "JAKKASANDRA"],
      },
      {
        name: "Parts of water system",
        difficulty: "hard" as const,
        words: ["CATCHMENT AREA", "TANKS", "KALUVE", "BOREWELL"],
      },
      {
        name: "Areas names based on nature",
        difficulty: "expert" as const,
        words: ["DOMLUR", "NAGARBHAVI", "HALASURU", "YELAHANKA"],
      },
    ],
    hints: [
      "They are large bodies of water",
      "These are areas named after lakes (look at the second half of the word)",
    ],
    funFact:
      "Domlur is named after Mosquitoes, Halsuru after jackfruits, Nagarbhavi after snakes and Yelahanka after leaves!",
  },
  {
    id: 2 as const,
    name: "Bangalore Nature",
    categories: [
      {
        name: "Important tree species",
        difficulty: "easy" as const,
        words: ["HONGE MARA", "BANYAN", "PEEPAL", "CLUSTER FIG"],
      },
      {
        name: "Forest Reserves",
        difficulty: "medium" as const,
        words: ["BANNERGHATTA", "TURAHALLI", "AVALAHALLI", "JARAKABANDI"],
      },
      {
        name: "Common ___ (birds of Bangalore)",
        difficulty: "hard" as const,
        words: ["MYNA", "WOODSHRIKE", "LORA", "KINGFISHER"],
      },
      {
        name: "Famous parks of Bengaluru",
        difficulty: "expert" as const,
        words: ["LALBAGH", "CUBBON", "M N KRISHNA RAO", "JAYA PRAKASH NARAYANA"],
      },
    ],
    hints: [
      "You can see them perched on trees or flying",
      "These trees are important for the ecosystem",
    ],
    funFact:
      "Banyan and Peepal are keystone species, which means the ecosystem would collapse without them.",
  },
];
