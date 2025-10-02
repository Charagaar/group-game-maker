import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>(DEFAULT_GAME_DATA);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin-authenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const saved = localStorage.getItem("linkup-game-data");
      if (saved) {
        try {
          setCategories(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to load saved data:", e);
        }
      }
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (password === "unmap2025") {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin-authenticated", "true");
      toast.success("Access granted!");
    } else {
      toast.error("Incorrect password");
    }
  };

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Enter admin password"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleLogin} className="flex-1">
                Login
              </Button>
              <Button variant="outline" onClick={() => navigate("/")} className="flex-1">
                Back to Game
              </Button>
            </div>
          </CardContent>
        </Card>
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
            <Button variant="outline" onClick={() => navigate("/")} className="w-full sm:w-auto">
              Back to Game
            </Button>
            <Button onClick={saveData} className="w-full sm:w-auto">Save Changes</Button>
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
                        {category.difficulty === 'easy' ? '1. Easy - Pastel Pink' :
                         category.difficulty === 'medium' ? '2. Medium - Pearl Aqua' :
                         category.difficulty === 'hard' ? '3. Hard - Pastel Yellow' :
                         '4. Expert - Papaya Orange'}
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
