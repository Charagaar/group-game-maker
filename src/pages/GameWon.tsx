import { Button } from "@/components/ui/button";
import { Share2, Instagram } from "lucide-react";
import { toast } from "sonner";

const INSTAGRAM_URL =
  "https://www.instagram.com/unmapped.blr?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";

export default function GameWon() {
  const shareGame = async () => {
    const url = window.location.origin;
    
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-4 p-8 bg-card rounded-lg border">
          <h2 className="text-3xl font-bold">Lesgooooo!! 🎉</h2>
          <p className="text-muted-foreground">
            You found all four groups!
          </p>
          <p className="text-muted-foreground">
            Let's go and share about us!
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={shareGame} variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Share with Friends
            </Button>
            <Button asChild variant="outline">
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="About Us on Instagram"
              >
                <Instagram className="mr-2 h-4 w-4" />
                About Us
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

