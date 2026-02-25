import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shuffle, Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fingerprintPuzzle, getClientId, startPlay, completePlay } from "@/lib/tracker";
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

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "unknown";

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

const difficultySolvedStyles = {
  easy: "bg-category-easy text-category-easy-foreground",
  medium: "bg-category-medium text-category-medium-foreground",
  hard: "bg-category-hard text-category-hard-foreground",
  expert: "bg-category-expert text-category-expert-foreground",
};

const difficultyOrder: Record<"easy" | "medium" | "hard" | "expert", number> = {
  easy: 1,
  medium: 2,
  hard: 3,
  expert: 4,
};

const getClientIdSafe = () => {
  try {
    return getClientId();
  } catch {
    return null;
  }
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
  const [puzzleId, setPuzzleId] = useState<string | null>(null);
  
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

    // Compute a stable puzzle fingerprint for client-side tracking
    const clientId = getClientIdSafe();
    const computedPuzzleId = fingerprintPuzzle(
      (gameData || []).map((c) => ({ name: c.name, words: c.words }))
    );
    setPuzzleId(computedPuzzleId);

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
        client_id: clientId,
        puzzle_id: computedPuzzleId,
      });

    if (!sessionError) {
      setSessionId(newSessionId);
      // Track locally as well
      try {
        startPlay(newSessionId, computedPuzzleId);
      } catch {}
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
    // Same logic pattern as before: scale by word length.
    // We use the longest word segment (for multi-word tiles) and only tighten
    // the mobile sizes because Lemon Milk is wider than the previous font.
    const wordLength = Math.max(...text.split(" ").map((part) => part.length));

    if (wordLength <= 4) return "text-base sm:text-2xl";
    if (wordLength <= 6) return "text-sm sm:text-xl";
    if (wordLength <= 8) return "text-xs sm:text-lg";
    if (wordLength <= 10) return "text-[10px] sm:text-base";
    if (wordLength <= 12) return "text-[9px] sm:text-sm";
    if (wordLength <= 14) return "text-[8px] sm:text-xs";
    return "text-[7px] sm:text-[11px]";
  };

  const toggleWord = (wordId: string) => {
    if (selectedWords.includes(wordId)) {
      setSelectedWords(selectedWords.filter((id) => id !== wordId));
    } else if (selectedWords.length < 4) {
      setSelectedWords([...selectedWords, wordId]);
    }
  };

  const deselectAll = () => {
    if (selectedWords.length === 0) {
      toast.info("Select a tile first");
      return;
    }
    setSelectedWords([]);
  };

  const submitGuess = async () => {
    if (gameLost) return;
    if (selectedWords.length !== 4) {
      toast.info("Select 4 tiles");
      return;
    }

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
                client_id: getClientIdSafe(),
                puzzle_id: puzzleId,
                app_version: APP_VERSION,
              })
              .eq("session_id", sessionId);
          }
          // Update local tracker as won
          try {
            if (puzzleId) {
              completePlay(sessionId!, puzzleId, true, mistakes, 4);
            }
          } catch {}
          
          // Navigate to game won page with session info
          navigate(`/game-won?session=${sessionId}`);
        }
      }
    } else {
      // Check if 3 out of 4 are from the same category
      const categoryCounts: Record<string, number> = {};
      selectedWordObjects.forEach((w) => {
        categoryCounts[w.category] = (categoryCounts[w.category] || 0) + 1;
      });
      const maxCount = Math.max(...Object.values(categoryCounts));
      
      setMistakes(mistakes + 1);
      setSelectedWords([]);
      
      if (maxCount === 3) {
        toast.info("Almost there!");
      } else {
        toast.error("Try again");
      }
      
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
              client_id: getClientIdSafe(),
              puzzle_id: puzzleId,
              app_version: APP_VERSION,
            })
            .eq("session_id", sessionId);
        }
        // Update local tracker as loss
        try {
          if (puzzleId) {
            completePlay(sessionId!, puzzleId, false, mistakes + 1, solvedCategories.length);
          }
        } catch {}
        
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
          <div className="relative inline-flex items-center justify-center">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 scale-[1.35] rounded-xl bg-white/5 blur-2xl"
            />
            <h1 className="inline-flex items-center justify-center rounded-lg border-0 outline-none ring-0 bg-white/72 px-4 py-2 text-2xl font-semibold uppercase tracking-[0.18em] text-foreground shadow-none backdrop-blur-sm sm:px-6 sm:py-3 sm:text-4xl">
              Unmap
            </h1>
          </div>
          <p className="text-xs sm:text-base text-muted-foreground tracking-[0.04em]">
            Make four groups of four words!
          </p>
        </div>

        {/* Solved Categories */}
        {solvedCategories.length > 0 && (
          <div className="space-y-1 sm:space-y-2">
            {[...solvedCategories]
              .sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty])
              .map((category) => (
              <div
                key={category.name}
                className={`relative overflow-hidden rounded-xl p-3 sm:p-4 shadow-[0_8px_20px_hsl(220_25%_20%_/_0.12)] transition-all ${difficultySolvedStyles[category.difficulty]}`}
              >
                <h3
                  className="relative z-10 mb-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.12em] opacity-95"
                >
                  {category.name}
                </h3>
                <p className="relative z-10 text-xs sm:text-sm leading-relaxed opacity-90">
                  {category.words.map((word, idx) => (
                    <span key={idx}>
                      {word.split(' ').join(' ')}
                      {idx < category.words.length - 1 && ', '}
                    </span>
                  ))}
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
                    word-tile aspect-square p-0.5 sm:p-2 font-semibold tracking-[-0.02em] ${getFontSize(word.text)}
                    transition-all duration-200
                    flex items-center justify-center text-center leading-tight
                    ${
                      isSelected
                        ? "is-selected scale-[0.98]"
                        : ""
                    }
                  `}
                >
                  <span className="max-w-full px-0 leading-none tracking-[-0.02em] flex flex-col items-center justify-center">
                    {word.text.split(' ').map((part, idx) => (
                      <span key={idx}>{part}</span>
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Game Controls */}
        {words.length > 0 && !isViewingAnswers && (
          <div className="relative z-20 space-y-2 sm:space-y-4">
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

            {!gameWon && !gameLost && (
              <div className="relative z-20 flex flex-row gap-1 justify-center items-center">
                <Button
                  variant="outline"
                  onClick={() => shuffleWords()}
                  size="sm"
                  className="min-w-0 flex-1 sm:flex-none text-[10px] sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  <Shuffle className="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">Shuffle</span>
                </Button>
                <Button
                  onClick={submitGuess}
                  size="sm"
                  className="min-w-0 flex-1 sm:flex-none text-[10px] sm:text-sm h-8 sm:h-9 px-2 sm:px-3 enabled:border-yellow-300/70 enabled:hover:bg-[hsl(50_100%_97%)] enabled:hover:border-yellow-300 enabled:focus-visible:ring-yellow-300 enabled:active:bg-[hsl(50_100%_92%)] enabled:active:shadow-[0_0_0_1px_rgba(250,204,21,0.45),0_0_18px_rgba(250,204,21,0.45)]"
                >
                  <span className="truncate">Submit</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={deselectAll}
                  size="sm"
                  className="min-w-0 flex-1 sm:flex-none text-[10px] sm:text-sm h-8 sm:h-9 px-2 sm:px-2.5"
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
              className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 hover:bg-category-easy hover:text-category-easy-foreground active:bg-category-easy active:text-category-easy-foreground"
            >
              Back to Results
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
