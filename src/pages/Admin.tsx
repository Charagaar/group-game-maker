import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  extractHintsFromRows,
  resolveHints,
  type PuzzleHints,
  readHintsFromStorage,
  writeHintsToStorage,
} from "@/lib/hints";
import { extractFactFromRows, readFactFromStorage, resolveFact, writeFactToStorage } from "@/lib/fact";

interface Category {
  id?: string;
  name: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  words: string[];
}

export default function Admin() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [hints, setHints] = useState<PuzzleHints>({ hint1: "", hint2: "" });
  const [fact, setFact] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated and has admin role
    checkAuthAndLoadData();
  }, [navigate]);

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      setLoading(false);
      return;
    }

    // Check if user has admin role
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roles) {
      toast.error("Admin access required");
      await supabase.auth.signOut();
      navigate("/auth");
      setLoading(false);
      return;
    }

    await loadCategories();
    setLoading(false);
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("game_categories")
      .select("*")
      .order("display_order");

    if (error) {
      toast.error("Failed to load categories");
      return;
    }

    const difficulties: Category["difficulty"][] = [
      "easy",
      "medium",
      "hard",
      "expert",
    ];

    const emptyWords = ["", "", "", ""];

    if (!data || data.length === 0) {
      // Initialize with one category per difficulty if nothing exists yet
      setCategories(
        difficulties.map((difficulty) => ({
          name: "",
          difficulty,
          words: emptyWords,
        }))
      );
      setHints(resolveHints(readHintsFromStorage()));
      setFact(readFactFromStorage());
      return;
    }

    const dbHints = extractHintsFromRows(data as unknown as Array<Record<string, unknown>>);
    setHints(resolveHints(dbHints, readHintsFromStorage()));
    const dbFact = extractFactFromRows(data as unknown as Array<Record<string, unknown>>);
    setFact(resolveFact(dbFact, readFactFromStorage()));

    // Normalize to exactly one category per difficulty in a fixed order
    const normalizedCategories: Category[] = difficulties.map((difficulty) => {
      const candidates = data
        .filter((cat) => cat.difficulty === difficulty)
        .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

      if (candidates.length > 0) {
        const picked = candidates[0];
        return {
          id: picked.id,
          name: picked.name,
          difficulty: picked.difficulty as Category["difficulty"],
          words: Array.isArray(picked.words) && picked.words.length > 0 ? picked.words : emptyWords,
        };
      }

      return {
        name: "",
        difficulty,
        words: emptyWords,
      };
    });

    setCategories(normalizedCategories);
  };
  const saveData = async () => {
    const normalizedHints = {
      hint1: hints.hint1.trim(),
      hint2: hints.hint2.trim(),
    };
    const normalizedFact = fact.trim();
    writeHintsToStorage(normalizedHints);
    writeFactToStorage(normalizedFact);

    const saveWithHintsAndFact = async () => {
      for (let index = 0; index < categories.length; index += 1) {
        const cat = categories[index];
        const payload = {
          name: cat.name,
          difficulty: cat.difficulty,
          words: cat.words,
          display_order: index + 1,
          hint_1: normalizedHints.hint1,
          hint_2: normalizedHints.hint2,
          puzzle_fact: normalizedFact,
        };

        if (cat.id) {
          const { error } = await supabase.from("game_categories").update(payload).eq("id", cat.id);
          if (error) return error;
        } else {
          const { error } = await supabase.from("game_categories").insert(payload);
          if (error) return error;
        }
      }

      return null;
    };

    const saveWithHintsOnly = async () => {
      for (let index = 0; index < categories.length; index += 1) {
        const cat = categories[index];
        const payload = {
          name: cat.name,
          difficulty: cat.difficulty,
          words: cat.words,
          display_order: index + 1,
          hint_1: normalizedHints.hint1,
          hint_2: normalizedHints.hint2,
        };

        if (cat.id) {
          const { error } = await supabase.from("game_categories").update(payload).eq("id", cat.id);
          if (error) return error;
        } else {
          const { error } = await supabase.from("game_categories").insert(payload);
          if (error) return error;
        }
      }

      return null;
    };

    const saveWithoutHints = async () => {
      const nextCategories: Category[] = [...categories];
      for (let index = 0; index < categories.length; index += 1) {
        const cat = categories[index];
        const payload = {
          name: cat.name,
          difficulty: cat.difficulty,
          words: cat.words,
          display_order: index + 1,
        };

        if (cat.id) {
          const { error } = await supabase.from("game_categories").update(payload).eq("id", cat.id);
          if (error) return { error, nextCategories };
        } else {
          const { data, error } = await supabase
            .from("game_categories")
            .insert(payload)
            .select("id")
            .single();
          if (error) return { error, nextCategories };
          if (data?.id) {
            nextCategories[index] = { ...cat, id: data.id };
          }
        }
      }

      return { error: null, nextCategories };
    };

    const withHintsAndFactError = await saveWithHintsAndFact();
    if (!withHintsAndFactError) {
      toast.success("Game data saved!");
      return;
    }

    const withHintsOnlyError = await saveWithHintsOnly();
    if (!withHintsOnlyError) {
      toast.success("Game data and hints saved. Fact is stored locally on this device until DB migration is applied.");
      return;
    }

    const fallbackResult = await saveWithoutHints();
    if (fallbackResult.error) {
      toast.error(`Failed to save categories: ${fallbackResult.error.message}`);
      return;
    }

    setCategories(fallbackResult.nextCategories);
    toast.success("Game data saved! Hints and fact are saved locally on this device until DB migration is applied.");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const updateCategory = (index: number, field: keyof Category, value: any) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  };

  const updateWord = (categoryIndex: number, wordIndex: number, value: string) => {
    const updated = [...categories];
    updated[categoryIndex].words[wordIndex] = value.toUpperCase();
    setCategories(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Unmap - Admin</h1>
            <p className="text-muted-foreground">Edit your game categories and words</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => navigate("/")} className="w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4">
              <span className="truncate">Back to Game</span>
            </Button>
            <Button variant="outline" onClick={() => navigate("/statistics")} className="w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4">
              <span className="truncate">Statistics</span>
            </Button>
            <Button onClick={saveData} className="w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4">
              <span className="truncate">Save Changes</span>
            </Button>
            <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4">
              <span className="truncate">Logout</span>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Puzzle Hints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hint-1">Hint 1</Label>
                <Textarea
                  id="hint-1"
                  value={hints.hint1}
                  onChange={(e) => setHints((prev) => ({ ...prev, hint1: e.target.value }))}
                  className="mt-2 min-h-[72px]"
                />
              </div>
              <div>
                <Label htmlFor="hint-2">Hint 2</Label>
                <Textarea
                  id="hint-2"
                  value={hints.hint2}
                  onChange={(e) => setHints((prev) => ({ ...prev, hint2: e.target.value }))}
                  className="mt-2 min-h-[72px]"
                />
              </div>
              <div>
                <Label htmlFor="puzzle-fact">Post-Game Fact</Label>
                <Textarea
                  id="puzzle-fact"
                  value={fact}
                  onChange={(e) => setFact(e.target.value)}
                  placeholder="One educational fact shown after win/loss"
                  className="mt-2 min-h-[72px]"
                />
              </div>
            </CardContent>
          </Card>

          {categories.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <CardTitle className="text-lg">Category {categoryIndex + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor={`name-${categoryIndex}`}>Category Name</Label>
                    <Input
                      id={`name-${categoryIndex}`}
                      value={category.name}
                      onChange={(e) =>
                        updateCategory(categoryIndex, "name", e.target.value)
                      }
                      placeholder="e.g., Bangalore Bookstores"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`difficulty-${categoryIndex}`}>Difficulty Level</Label>
                    <select
                      id={`difficulty-${categoryIndex}`}
                      value={category.difficulty}
                      onChange={(e) =>
                        updateCategory(categoryIndex, "difficulty", e.target.value)
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="easy">1. Easy - Pastel Pink</option>
                      <option value="medium">2. Medium - Pearl Aqua</option>
                      <option value="hard">3. Hard - Pastel Yellow</option>
                      <option value="expert">4. Expert - Papaya Orange</option>
                    </select>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Preview:</span>
                      <div
                        className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                          category.difficulty === 'easy' ? 'bg-category-easy text-category-easy-foreground' :
                          category.difficulty === 'medium' ? 'bg-category-medium text-category-medium-foreground' :
                          category.difficulty === 'hard' ? 'bg-category-hard text-category-hard-foreground' :
                          'bg-category-expert text-category-expert-foreground'
                        }`}
                      >
                        {category.difficulty === 'easy' ? 'Easy' :
                         category.difficulty === 'medium' ? 'Medium' :
                         category.difficulty === 'hard' ? 'Hard' :
                         'Expert'}
                      </div>
                    </div>
                  </div>

                   <div>
                     <Label>Words (4 required)</Label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {category.words.map((word, wordIndex) => (
                        <Input
                          key={wordIndex}
                          value={word}
                          onChange={(e) =>
                            updateWord(categoryIndex, wordIndex, e.target.value)
                          }
                          placeholder={`Word ${wordIndex + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
