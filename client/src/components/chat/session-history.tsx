import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SessionListItem {
  sessionId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface SessionHistoryProps {
  onLoadSession: (sessionId: string) => void;
  currentSessionId: string | null;
}

export function SessionHistory({ onLoadSession, currentSessionId }: SessionHistoryProps) {
  const { data: sessions = [], isLoading } = useQuery<SessionListItem[]>({
    queryKey: ['/api/sessions'],
  });

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading sessions...
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-4 text-center">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          No conversation history yet
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-2">
        <h2 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wide">
          History
        </h2>
        {sessions.map((session) => (
          <Button
            key={session.sessionId}
            variant={currentSessionId === session.sessionId ? "secondary" : "ghost"}
            className="w-full justify-start text-left h-auto py-3 px-3"
            onClick={() => onLoadSession(session.sessionId)}
            data-testid={`session-${session.sessionId}`}
          >
            <div className="flex flex-col items-start w-full gap-1">
              <p className="text-sm font-medium line-clamp-2">
                {session.title}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>
                  {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}
