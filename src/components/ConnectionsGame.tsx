import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shuffle } from "lucide-react";
import { toast } from "sonner";

interface Word {
  id: string;
  text: string;
  category: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
}

interface Category {
  name: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  words: string[];
}

const GAME_DATA: Category[] = [
  {
    name: "Things you find in a park",
    difficulty: "easy",
    words: ["GAZEBO", "PATHWAYS", "PLAYGROUND", "GYM"],
  },
  {
    name: "Bangalore Bookstores",
    difficulty: "medium",
    words: ["BLOSSOMS", "SELECT", "SAPNA", "HIGGINBOTHAMS"],
  },
  {
    name: "Lakes that have been reclaimed",
    difficulty: "hard",
    words: ["SHOOLAY", "HENNUR", "DHARMAMBUDHI", "MILLER"],
  },
  {
    name: "Jungle________",
    difficulty: "expert",
    words: ["MYNA", "CROW", "PRINIA", "BABBLER"],
  },
];

const difficultyColors = {
  easy: "bg-category-easy text-category-easy-foreground",
  medium: "bg-category-medium text-category-medium-foreground",
  hard: "bg-category-hard text-category-hard-foreground",
  expert: "bg-category-expert text-category-expert-foreground",
};

export default function ConnectionsGame() {
  const [words, setWords] = useState<Word[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [solvedCategories, setSolvedCategories] = useState<Category[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const allWords: Word[] = [];
    GAME_DATA.forEach((category) => {
      category.words.forEach((word) => {
        allWords.push({
          id: `${category.name}-${word}`,
          text: word,
          category: category.name,
          difficulty: category.difficulty,
        });
      });
    });
    shuffleWords(allWords);
  };

  const shuffleWords = (wordsToShuffle: Word[] = words) => {
    const shuffled = [...wordsToShuffle].sort(() => Math.random() - 0.5);
    setWords(shuffled);
  };

  const toggleWord = (wordId: string) => {
    if (selectedWords.includes(wordId)) {
      setSelectedWords(selectedWords.filter((id) => id !== wordId));
    } else if (selectedWords.length < 4) {
      setSelectedWords([...selectedWords, wordId]);
    }
  };

  const deselectAll = () => {
    setSelectedWords([]);
  };

  const submitGuess = () => {
    if (selectedWords.length !== 4) return;

    const selectedWordObjects = words.filter((w) => selectedWords.includes(w.id));
    const categories = [...new Set(selectedWordObjects.map((w) => w.category))];

    if (categories.length === 1) {
      const category = GAME_DATA.find((c) => c.name === categories[0]);
      if (category) {
        setSolvedCategories([...solvedCategories, category]);
        setWords(words.filter((w) => !selectedWords.includes(w.id)));
        setSelectedWords([]);
        toast.success("Correct! Well done!");

        if (solvedCategories.length === 3) {
          setGameWon(true);
          toast.success("Congratulations! You won!");
        }
      }
    } else {
      setMistakes(mistakes + 1);
      setSelectedWords([]);
      toast.error("Not quite right. Try again!");
      
      if (mistakes >= 3) {
        toast.error("Game Over! You've used all your attempts.");
      }
    }
  };

  const remainingAttempts = 4 - mistakes;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Connections</h1>
          <p className="text-muted-foreground">
            Create four groups of four!
          </p>
        </div>

        {/* Solved Categories */}
        {solvedCategories.length > 0 && (
          <div className="space-y-2">
            {solvedCategories.map((category) => (
              <div
                key={category.name}
                className={`p-4 rounded-lg ${difficultyColors[category.difficulty]} transition-all`}
              >
                <h3 className="font-semibold text-sm uppercase mb-1">
                  {category.name}
                </h3>
                <p className="text-sm opacity-90">
                  {category.words.join(", ")}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Game Won Message */}
        {gameWon && (
          <div className="text-center space-y-4 p-8 bg-card rounded-lg border">
            <h2 className="text-3xl font-bold">Perfect! 🎉</h2>
            <p className="text-muted-foreground">
              You found all four connections!
            </p>
            <Button onClick={initializeGame}>Play Again</Button>
          </div>
        )}

        {/* Word Grid */}
        {!gameWon && words.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {words.map((word) => {
              const isSelected = selectedWords.includes(word.id);
              return (
                <button
                  key={word.id}
                  onClick={() => toggleWord(word.id)}
                  className={`
                    aspect-square p-4 rounded-lg font-semibold text-sm
                    transition-all duration-200
                    flex items-center justify-center text-center
                    ${
                      isSelected
                        ? "bg-selected text-selected-foreground scale-95"
                        : "bg-card hover:bg-hover border border-border"
                    }
                  `}
                >
                  {word.text}
                </button>
              );
            })}
          </div>
        )}

        {/* Game Controls */}
        {!gameWon && words.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">
                Mistakes remaining:
              </span>
              <div className="flex gap-1">
                {[...Array(remainingAttempts)].map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-foreground"
                  />
                ))}
                {[...Array(mistakes)].map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-full bg-muted"
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => shuffleWords()}
                size="lg"
              >
                <Shuffle className="mr-2 h-4 w-4" />
                Shuffle
              </Button>
              <Button
                variant="outline"
                onClick={deselectAll}
                disabled={selectedWords.length === 0}
                size="lg"
              >
                Deselect All
              </Button>
              <Button
                onClick={submitGuess}
                disabled={selectedWords.length !== 4}
                size="lg"
              >
                Submit
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
