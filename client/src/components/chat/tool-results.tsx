interface ToolResult {
  tool: string;
  result: any;
}

interface ToolResultsProps {
  toolResults: ToolResult[];
  pythonCode?: string;
}

export function ToolResults({ toolResults }: ToolResultsProps) {
  // Ne rien afficher - les steps sont déjà affichés par AgentSteps
  return null;
}
