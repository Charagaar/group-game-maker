import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shuffle, Heart, Share2 } from "lucide-react";
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
    const saved = localStorage.getItem("linkup-game-data");
    const gameData = saved ? JSON.parse(saved) : GAME_DATA;
    
    gameData.forEach((category: Category) => {
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
      const saved = localStorage.getItem("linkup-game-data");
      const gameData = saved ? JSON.parse(saved) : GAME_DATA;
      const category = gameData.find((c: Category) => c.name === categories[0]);
      if (category) {
        setSolvedCategories([...solvedCategories, category]);
        setWords(words.filter((w) => !selectedWords.includes(w.id)));
        setSelectedWords([]);
        toast.success("Yay!");

        if (solvedCategories.length === 3) {
          setGameWon(true);
          toast.success("Congratulations! You won!");
        }
      }
    } else {
      setMistakes(mistakes + 1);
      setSelectedWords([]);
      toast.error("Try again");
      
      if (mistakes >= 3) {
        toast.error("Game Over! You've used all your attempts.");
      }
    }
  };

  const shareGame = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Unmap',
          text: 'Check out this fun word puzzle game!',
          url: url,
        });
      } catch (err) {
        // User cancelled share or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy link");
      }
    }
  };

  const remainingAttempts = 4 - mistakes;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-1 sm:p-4 bg-background">
      <div className="w-full max-w-2xl space-y-2 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-0.5 sm:space-y-2">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">Unmap</h1>
          <p className="text-xs sm:text-base text-muted-foreground">
            Make four groups of four words!
          </p>
        </div>

        {/* Solved Categories */}
        {solvedCategories.length > 0 && (
          <div className="space-y-1 sm:space-y-2">
            {solvedCategories.map((category) => (
              <div
                key={category.name}
                className={`p-2 sm:p-4 rounded-lg ${difficultyColors[category.difficulty]} transition-all`}
              >
                <h3 className="font-semibold text-xs sm:text-sm uppercase mb-0.5 sm:mb-1">
                  {category.name}
                </h3>
                <p className="text-xs sm:text-sm opacity-90">
                  {category.words.join(", ")}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Game Won Message */}
        {gameWon && (
          <div className="text-center space-y-4 p-8 bg-card rounded-lg border">
            <h2 className="text-3xl font-bold">Lesgooooo!! 🎉</h2>
            <p className="text-muted-foreground">
              You found all four groups!
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={initializeGame}>Play Again</Button>
              <Button onClick={shareGame} variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                Share with Friends
              </Button>
            </div>
          </div>
        )}

        {/* Word Grid */}
        {!gameWon && words.length > 0 && (
          <div className="grid grid-cols-4 gap-1 sm:gap-2">
            {words.map((word) => {
              const isSelected = selectedWords.includes(word.id);
              return (
                <button
                  key={word.id}
                  onClick={() => toggleWord(word.id)}
                  className={`
                    aspect-square p-1 sm:p-4 rounded-lg font-semibold text-[10px] sm:text-sm
                    transition-all duration-200
                    flex items-center justify-center text-center leading-tight
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
          <div className="space-y-2 sm:space-y-4">
            <div className="flex items-center justify-center gap-1">
              {[...Array(remainingAttempts)].map((_, i) => (
                <Heart
                  key={`filled-${i}`}
                  className="w-5 h-5 sm:w-6 sm:h-6 fill-destructive text-destructive"
                />
              ))}
              {[...Array(mistakes)].map((_, i) => (
                <Heart
                  key={`empty-${i}`}
                  className="w-5 h-5 sm:w-6 sm:h-6 text-muted"
                />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => shuffleWords()}
                size="sm"
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <Shuffle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Shuffle
              </Button>
              <Button
                onClick={submitGuess}
                disabled={selectedWords.length !== 4}
                size="sm"
                className="w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                Submit {selectedWords.length > 0 && `(${selectedWords.length}/4)`}
              </Button>
              <Button
                variant="outline"
                onClick={deselectAll}
                disabled={selectedWords.length === 0}
                size="sm"
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Deselect All
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
