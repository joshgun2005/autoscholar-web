import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StreamingAnswer } from "./streaming-answer";

interface ConversationMessage {
  question: string;
  answer: string;
}

interface ConversationHistoryProps {
  history: ConversationMessage[];
}

export function ConversationHistory({ history }: ConversationHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 space-y-3">
      {history.map((message, index) => (
        <Accordion 
          key={index} 
          type="single" 
          collapsible 
          className="w-full"
          data-testid={`accordion-conversation-${index}`}
        >
          <AccordionItem value={`item-${index}`} className="border rounded-lg">
            <AccordionTrigger 
              className="px-4 py-3 hover-elevate no-underline text-left"
              data-testid={`trigger-conversation-${index}`}
            >
              <div className="flex items-start gap-3 w-full pr-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {message.question}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="pl-11">
                <div className="mb-3 text-sm font-medium text-muted-foreground">
                  Question:
                </div>
                <div className="mb-4 p-3 rounded-md bg-muted/50">
                  <p className="text-sm">{message.question}</p>
                </div>
                <div className="mb-3 text-sm font-medium text-muted-foreground">
                  Answer:
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <StreamingAnswer 
                    content={message.answer}
                    isStreaming={false}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ))}
    </div>
  );
}
