import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Share2, Instagram, Copy } from "lucide-react";
import { buildAchievementMessage, buildWhatsAppShareUrl, buildWhatsAppWebShareUrl, parseSolvedDifficultiesParam } from "@/lib/share";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

const ABOUT_US_URL = "https://www.un-mapped.com";
const resultButtonClass =
  "w-full text-sm sm:text-base px-4 py-3 border-0 opacity-100 bg-[#c8f5a6] text-black hover:bg-category-easy hover:text-category-easy-foreground active:bg-category-easy active:text-category-easy-foreground";

export default function GameWon() {
  const navigate = useNavigate();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  const rawScore = searchParams.get("score");
  const parsedScore = rawScore ? Number(rawScore) : NaN;
  const score = Number.isFinite(parsedScore) ? parsedScore : 4;
  const solvedDifficulties = parseSolvedDifficultiesParam(searchParams.get("solved"));
  const shareMessage = buildAchievementMessage(
    score,
    solvedDifficulties.length ? solvedDifficulties : ["easy", "medium", "hard", "expert"]
  );

  const copyShareMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      toast.success("Share message copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy share message");
    }
  };

  const shareGame = async () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const whatsappUrl = isMobile ? buildWhatsAppShareUrl(shareMessage) : buildWhatsAppWebShareUrl(shareMessage);
    
    try {
      const opened = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      if (opened) return;
    } catch (err) {
      // Fall through to clipboard fallback
    }

    try {
      await copyShareMessage();
    } catch (err) {
      toast.error("Failed to prepare share message");
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
            <Button onClick={() => setShareDialogOpen(true)} variant="secondary" className={resultButtonClass}>
              <Share2 className="mr-2 h-4 w-4 shrink-0" />
              <span className="truncate">Share with Friends</span>
            </Button>
            <Button asChild variant="secondary" className={resultButtonClass}>
              <a
                href={ABOUT_US_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="About Us website"
                className="flex items-center"
              >
                <Instagram className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">About Us</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Result</DialogTitle>
            <DialogDescription>
              Choose how you want to share your achievement.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button
              onClick={async () => {
                setShareDialogOpen(false);
                await shareGame();
              }}
              className="justify-start"
            >
              <Share2 className="h-4 w-4" />
              Share on WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                setShareDialogOpen(false);
                await copyShareMessage();
              }}
              className="justify-start"
            >
              <Copy className="h-4 w-4" />
              Copy Share Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


