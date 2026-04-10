import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Session {
  id: string;
  sessionId: string;
  userId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
}

interface SharedReport {
  id: string;
  shareId: string;
  question: string;
  createdAt: string;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

interface SessionsTableProps {
  sessions: Session[];
  onDeleteSession: (id: string) => void;
}

export function SessionsTable({ sessions, onDeleteSession }: SessionsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Conversation Sessions</CardTitle>
        <CardDescription>Manage conversation history</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session ID</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-mono text-xs">{session.sessionId.substring(0, 8)}...</TableCell>
                <TableCell className="font-mono text-xs">
                  {session.userId ? `${session.userId.substring(0, 8)}...` : "Anonymous"}
                </TableCell>
                <TableCell className="max-w-md truncate">{session.title}</TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {(session.inputTokens + session.outputTokens).toLocaleString()}
                  <span className="text-muted-foreground ml-1">
                    ({session.inputTokens}↑/{session.outputTokens}↓)
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium text-primary">
                  ${session.totalCost.toFixed(4)}
                </TableCell>
                <TableCell>{formatDate(session.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteSession(session.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

interface ReportsTableProps {
  reports: SharedReport[];
  onDeleteReport: (id: string) => void;
}

export function ReportsTable({ reports, onDeleteReport }: ReportsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Shared Reports</CardTitle>
        <CardDescription>Manage publicly shared reports</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Share ID</TableHead>
              <TableHead>Question Preview</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-mono text-xs">{report.shareId}</TableCell>
                <TableCell className="max-w-md truncate">{report.question}</TableCell>
                <TableCell>{formatDate(report.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteReport(report.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
