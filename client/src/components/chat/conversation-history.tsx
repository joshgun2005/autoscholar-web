import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StreamingAnswer } from "@/components/streaming-answer";

interface ConversationMessage {
  question: string;
  answer: string;
}

interface ConversationHistoryProps {
  history: ConversationMessage[];
}

export function ConversationHistory({ history }: ConversationHistoryProps) {
  // Track which accordions have been opened so we only mount StreamingAnswer
  // once the user actually wants to see it (avoids rendering all past papers)
  const [mountedItems, setMountedItems] = useState<Set<number>>(new Set());

  if (history.length === 0) {
    return null;
  }

  const handleValueChange = (index: number) => (value: string) => {
    if (value) {
      setMountedItems(prev => {
        const next = new Set(prev);
        next.add(index);
        return next;
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 space-y-3">
      {history.map((message, index) => (
        <Accordion
          key={index}
          type="single"
          collapsible
          className="w-full"
          onValueChange={handleValueChange(index)}
          data-testid={`accordion-conversation-${index}`}
        >
          <AccordionItem value={`item-${index}`} className="border border-border/50 rounded-2xl overflow-hidden bg-card/50">
            <AccordionTrigger
              className="px-6 py-5 hover-elevate no-underline text-left hover:bg-muted/25 transition-colors"
              data-testid={`trigger-conversation-${index}`}
            >
              <div className="flex items-start gap-3.5 w-full pr-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center text-[12px] font-bold text-primary">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate tracking-[-0.01em]">
                    {message.question}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="pl-[52px]">
                <div className="mb-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em]">
                  Question
                </div>
                <div className="mb-5 p-5 rounded-2xl bg-muted/30 border border-border/40">
                  <p className="text-[14px] font-medium leading-relaxed">{message.question}</p>
                </div>
                <div className="mb-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em]">
                  Response
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {/* Only mount StreamingAnswer once this accordion has been opened */}
                  {mountedItems.has(index) ? (
                    <StreamingAnswer
                      content={message.answer}
                      isStreaming={false}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground/60 italic">Click to load response...</p>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ))}
    </div>
  );
}
