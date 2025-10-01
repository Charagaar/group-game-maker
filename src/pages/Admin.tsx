import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

interface Category {
  name: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  words: string[];
}

const DEFAULT_GAME_DATA: Category[] = [
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

export default function Admin() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_GAME_DATA);

  useEffect(() => {
    const saved = localStorage.getItem("linkup-game-data");
    if (saved) {
      try {
        setCategories(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved data:", e);
      }
    }
  }, []);

  const saveData = () => {
    localStorage.setItem("linkup-game-data", JSON.stringify(categories));
    toast.success("Game data saved!");
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

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Link Up Bangalore - Admin</h1>
            <p className="text-muted-foreground">Edit your game categories and words</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              Back to Game
            </Button>
            <Button onClick={saveData}>Save Changes</Button>
          </div>
        </div>

        <div className="space-y-4">
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
                    <Label htmlFor={`difficulty-${categoryIndex}`}>Difficulty</Label>
                    <select
                      id={`difficulty-${categoryIndex}`}
                      value={category.difficulty}
                      onChange={(e) =>
                        updateCategory(categoryIndex, "difficulty", e.target.value)
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="easy">Easy (Pink)</option>
                      <option value="medium">Medium (Aqua)</option>
                      <option value="hard">Hard (Yellow)</option>
                      <option value="expert">Expert (Orange)</option>
                    </select>
                  </div>

                  <div>
                    <Label>Words (4 required)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
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
