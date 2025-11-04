import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shuffle, Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";

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

// Fallback game data if database is empty
const FALLBACK_GAME_DATA: Category[] = [
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
    name: "Areas in Bangalore named after politicians",
    difficulty: "expert",
    words: ["RT NAGAR", "SADASHIVNAGAR", "JP NAGAR", "MG ROAD"],
  },
];

const difficultyColors = {
  easy: "bg-category-easy text-category-easy-foreground",
  medium: "bg-category-medium text-category-medium-foreground",
  hard: "bg-category-hard text-category-hard-foreground",
  expert: "bg-category-expert text-category-expert-foreground",
};

export default function ConnectionsGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [words, setWords] = useState<Word[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [solvedCategories, setSolvedCategories] = useState<Category[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [gameLost, setGameLost] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Check if we're in "view answers" mode
  const viewMode = searchParams.get('view');
  const isViewingAnswers = viewMode === 'answers';
  const resultType = searchParams.get('result'); // 'won' or 'lost'

  useEffect(() => {
    if (isViewingAnswers) return; // Skip game init when viewing answers
    initializeGame();
  }, [isViewingAnswers]);

  // If viewing answers, reveal all categories
  useEffect(() => {
    if (isViewingAnswers) {
      const loadAnswers = async () => {
        let gameData: Category[] = FALLBACK_GAME_DATA;
        
        try {
          const { data, error } = await supabase
            .from("game_categories")
            .select("*")
            .order("display_order");

          if (error) {
            console.error("Failed to load game data:", error);
          } else if (data && data.length > 0) {
            gameData = data.map(cat => ({
              name: cat.name,
              difficulty: cat.difficulty as "easy" | "medium" | "hard" | "expert",
              words: cat.words,
            }));
          }
        } catch (err) {
          console.error("Error loading game data:", err);
        }
        
        setSolvedCategories(gameData);
        setWords([]);
        if (resultType === 'won') {
          setGameWon(true);
        } else if (resultType === 'lost') {
          setGameLost(true);
        }
      };
      
      loadAnswers();
    }
  }, [isViewingAnswers, resultType]);

  const initializeGame = async () => {
    let gameData: Category[] = FALLBACK_GAME_DATA;
    
    try {
      const { data, error } = await supabase
        .from("game_categories")
        .select("*")
        .order("display_order");

      if (error) {
        console.error("Failed to load game data from database:", error);
      } else if (data && data.length > 0) {
        // Convert database format to Category format
        gameData = data.map(cat => ({
          name: cat.name,
          difficulty: cat.difficulty as "easy" | "medium" | "hard" | "expert",
          words: cat.words,
        }));
      } else {
        console.warn("No game data in database, using fallback");
      }
    } catch (err) {
      console.error("Error loading game data:", err);
    }

    const allWords: Word[] = [];
    gameData.forEach((category) => {
      category.words.forEach((word: string) => {
        allWords.push({
          id: `${category.name}-${word}`,
          text: word,
          category: category.name,
          difficulty: category.difficulty as "easy" | "medium" | "hard" | "expert",
        });
      });
    });
    shuffleWords(allWords);

    // Track game session
    const newSessionId = crypto.randomUUID();
    const { error: sessionError } = await supabase
      .from("game_sessions")
      .insert({
        session_id: newSessionId,
      });

    if (!sessionError) {
      setSessionId(newSessionId);
    }

    // Reset game state
    setSolvedCategories([]);
    setMistakes(0);
    setGameWon(false);
    setGameLost(false);
  };

  const shuffleWords = (wordsToShuffle: Word[] = words) => {
    const shuffled = [...wordsToShuffle].sort(() => Math.random() - 0.5);
    setWords(shuffled);
  };

  const getFontSize = (text: string) => {
    const length = text.length;
    if (length <= 6) return 'text-[7px] sm:text-xs';
    if (length <= 10) return 'text-[6px] sm:text-[10px]';
    if (length <= 14) return 'text-[5px] sm:text-[9px]';
    return 'text-[4.5px] sm:text-[8px]';
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

  const submitGuess = async () => {
    if (gameLost) return;
    if (selectedWords.length !== 4) return;

    const selectedWordObjects = words.filter((w) => selectedWords.includes(w.id));
    const categories = [...new Set(selectedWordObjects.map((w) => w.category))];

    if (categories.length === 1) {
      let categoryData: Category | null = null;
      
      // Try to get category from database
      const { data, error } = await supabase
        .from("game_categories")
        .select("*")
        .eq("name", categories[0])
        .single();

      if (data) {
        categoryData = {
          name: data.name,
          difficulty: data.difficulty as "easy" | "medium" | "hard" | "expert",
          words: data.words,
        };
      } else if (error || !data) {
        // Fallback: construct category from selected words
        const firstWord = selectedWordObjects[0];
        categoryData = {
          name: firstWord.category,
          difficulty: firstWord.difficulty,
          words: selectedWordObjects.map(w => w.text),
        };
      }

      if (categoryData) {
        setSolvedCategories([...solvedCategories, categoryData]);
        setWords(words.filter((w) => !selectedWords.includes(w.id)));
        setSelectedWords([]);
        toast.success("Yay!");

        if (solvedCategories.length === 3) {
          setGameWon(true);
          toast.success("Congratulations! You won!");
          
          // Update session as won
          if (sessionId) {
            await supabase
              .from("game_sessions")
              .update({
                completed_at: new Date().toISOString(),
                game_won: true,
                lives_lost: mistakes,
                categories_solved: 4,
              })
              .eq("session_id", sessionId);
          }
          
          // Navigate to game won page with session info
          navigate(`/game-won?session=${sessionId}`);
        }
      }
    } else {
      setMistakes(mistakes + 1);
      setSelectedWords([]);
      toast.error("Try again");
      
      if (mistakes >= 3) {
        toast.error("Game Over! You've used all your attempts.");
        setGameLost(true);
        
        // Update session as lost
        if (sessionId) {
          await supabase
            .from("game_sessions")
            .update({
              completed_at: new Date().toISOString(),
              game_won: false,
              lives_lost: mistakes + 1,
              categories_solved: solvedCategories.length,
            })
            .eq("session_id", sessionId);
        }
        
        // Navigate to game over page with session info
        navigate(`/game-over?session=${sessionId}`);
      }
    }
  };

  const remainingAttempts = Math.max(0, 4 - mistakes);

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


        {/* Word Grid */}
        {words.length > 0 && (
          <div className="grid grid-cols-4 gap-1 sm:gap-2">
            {words.map((word) => {
              const isSelected = selectedWords.includes(word.id);
              return (
                <button
                  key={word.id}
                  onClick={() => toggleWord(word.id)}
                  className={`
                    aspect-square p-1 sm:p-2 rounded-lg font-semibold ${getFontSize(word.text)}
                    transition-all duration-200
                    flex items-center justify-center text-center leading-tight
                    break-words overflow-wrap-anywhere
                    ${
                      isSelected
                        ? "bg-selected text-selected-foreground scale-95"
                        : "bg-card hover:bg-hover border border-border"
                    }
                  `}
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    hyphens: 'none'
                  }}
                >
                  <span className="max-w-full px-0.5 leading-[1.1]">{word.text}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Game Controls */}
        {words.length > 0 && !isViewingAnswers && (
          <div className="space-y-2 sm:space-y-4">
            <div className="flex items-center justify-center gap-1">
              {[...Array(remainingAttempts)].map((_, i) => (
                <Heart
                  key={`filled-${i}`}
                  className="w-5 h-5 sm:w-6 sm:h-6 fill-destructive text-destructive"
                  style={{ imageRendering: 'pixelated' }}
                />
              ))}
              {[...Array(mistakes)].map((_, i) => (
                <Heart
                  key={`empty-${i}`}
                  className="w-5 h-5 sm:w-6 sm:h-6 text-muted"
                  style={{ imageRendering: 'pixelated' }}
                />
              ))}
            </div>

            {!gameWon && !gameLost && (
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => shuffleWords()}
                  size="sm"
                  className="w-full sm:w-auto text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Shuffle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">Shuffle</span>
                </Button>
                <Button
                  onClick={submitGuess}
                  disabled={selectedWords.length !== 4}
                  size="sm"
                  className="w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm px-2 sm:px-3"
                >
                  <span className="truncate">
                    Submit {selectedWords.length > 0 && `(${selectedWords.length}/4)`}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  onClick={deselectAll}
                  disabled={selectedWords.length === 0}
                  size="sm"
                  className="w-full sm:w-auto text-xs sm:text-sm px-2 sm:px-3"
                >
                  <span className="truncate">Deselect All</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Back to Results Button - shown when viewing answers */}
        {isViewingAnswers && (
          <div className="flex justify-center">
            <Button
              onClick={() => navigate(resultType === 'won' ? `/game-won?session=${sessionId}` : `/game-over?session=${sessionId}`)}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8"
            >
              Back to Results
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
