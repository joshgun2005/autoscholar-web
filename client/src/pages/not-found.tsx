import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-6">
      <div className="text-center max-w-md space-y-6">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.2em]">Error 404</p>
          <h1 className="text-3xl font-bold text-foreground tracking-[-0.03em]">Page not found</h1>
        </div>
        <p className="text-[14px] text-muted-foreground/60 leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button variant="outline" onClick={() => setLocation("/")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Button>
      </div>
    </div>
  );
}
