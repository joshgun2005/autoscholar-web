import { Check } from "lucide-react";

export interface AgentStep {
  tool: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  input?: any;
  error?: string;
  duration?: number;
}

interface AgentStepsProps {
  steps: AgentStep[];
  currentStep?: number;
}

export function AgentSteps({ steps, currentStep }: AgentStepsProps) {
  if (steps.length === 0) return null;

  // Only show completed steps with simple green circle and checkmark
  const completedSteps = steps.filter(s => s.status === 'completed');

  if (completedSteps.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {completedSteps.map((step, index) => (
        <div
          key={`${step.tool}-${index}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20"
        >
          <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 text-green-500" />
          </div>
          <span className="text-xs text-muted-foreground">
            {step.tool.replace(/_/g, ' ')}
          </span>
        </div>
      ))}
    </div>
  );
}
