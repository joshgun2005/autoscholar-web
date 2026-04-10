import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { API_BASE_URL } from "@/config";

/**
 * ASID Landing Page — resolves an AutoScholar ID to the paper detail page.
 * Route: /paper/:asid
 * Example: /paper/ASID-2026-0001
 */
export default function AsidResolver() {
  const params = useParams<{ asid: string }>();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!params.asid) return;

    fetch(`${API_BASE_URL}/api/asid/${encodeURIComponent(params.asid)}`)
      .then(res => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(paper => {
        setLocation(`/journal/${paper.id}`, { replace: true });
      })
      .catch(() => {
        setLocation(`/journal`, { replace: true });
      });
  }, [params.asid, setLocation]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-3">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-muted-foreground">
          Resolving ASID...
        </p>
      </div>
    </div>
  );
}
