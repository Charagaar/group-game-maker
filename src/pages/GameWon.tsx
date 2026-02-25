import { Button } from "@/components/ui/button";
import { Share2, Instagram } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

const INSTAGRAM_URL =
  "https://www.instagram.com/unmapped.blr?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";
const resultButtonClass =
  "w-full text-sm sm:text-base px-4 py-3 border-0 opacity-100 bg-[#c8f5a6] text-black hover:bg-category-easy hover:text-category-easy-foreground active:bg-category-easy active:text-category-easy-foreground";

export default function GameWon() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background motion-safe:animate-page-slide-up motion-reduce:animate-none will-change-transform">
      <div className="w-full max-w-3xl space-y-6">
        <div className="text-center space-y-4 p-10 sm:p-12 bg-card rounded-lg border">
          <h2 className="text-3xl font-bold">You got it!</h2>
          <p className="text-muted-foreground">
            You found all four groups!
          </p>
          <div className="mx-auto flex w-full max-w-md flex-col gap-2">
            <Button 
              onClick={() => navigate(`/?view=answers&result=won${sessionId ? `&session=${sessionId}` : ''}`)} 
              variant="secondary" 
              className={resultButtonClass}
            >
              <span className="truncate">View Answers</span>
            </Button>
            <Button onClick={shareGame} variant="secondary" className={resultButtonClass}>
              <Share2 className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Share with Friends</span>
            </Button>
            <Button asChild variant="secondary" className={resultButtonClass}>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="About Us on Instagram"
                className="flex items-center"
              >
                <Instagram className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">About Us</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


