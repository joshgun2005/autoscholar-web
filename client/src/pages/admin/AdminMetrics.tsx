import { Activity, MessageSquare, DollarSign, AlertCircle, Zap, TrendingUp, Users as UsersIcon, BookOpen, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ActiveUsersData {
  total: number;
  generating: number;
  idle: number;
  error: number;
  users: Array<{
    sessionId: string;
    userId: string | null;
    status: string;
    currentQuery: string | null;
    lastHeartbeat: string;
    userAgent: string | null;
  }>;
}

interface RealTimeStats {
  activeUsers: {
    total: number;
    generating: number;
  };
  sessions: {
    total: number;
    today: number;
  };
  tokens: {
    total: number;
    input: number;
    output: number;
  };
  cost: {
    total: number;
    today: number;
  };
  errors: {
    lastHour: number;
    rate: number;
  };
}

interface Metrics {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  totalSessions: number;
  averageCostPerSession: number;
  userMetrics: Array<{
    userId: string;
    displayName: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    sessionCount: number;
  }>;
}

interface AdminMetricsProps {
  activeUsersData: ActiveUsersData | null;
  realTimeStats: RealTimeStats | null;
  metrics: Metrics;
  totalPapers?: number;
  visiblePapers?: number;
  totalUsers?: number;
}

export function AdminMetrics({ activeUsersData, realTimeStats, metrics, totalPapers, visiblePapers, totalUsers }: AdminMetricsProps) {
  return (
    <div className="space-y-6">
      {/* Real-Time Active Users Section */}
      {activeUsersData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500 animate-pulse" />
              Live Activity Monitor
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                {activeUsersData.generating} Generating
              </Badge>
              <Badge variant="secondary">
                {activeUsersData.total} Active
              </Badge>
            </div>
          </div>

          {activeUsersData.users.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Current Query</TableHead>
                      <TableHead>Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeUsersData.users.map((user) => (
                      <TableRow key={user.sessionId}>
                        <TableCell className="font-mono text-xs">
                          {user.sessionId.substring(0, 12)}...
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.status === 'generating' ? 'default' :
                              user.status === 'error' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {user.status === 'generating' && <Zap className="w-3 h-3 mr-1 animate-pulse" />}
                            {user.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {user.currentQuery || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(user.lastHeartbeat).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active users at the moment</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Real-Time Stats Overview */}
      {realTimeStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-green-500/50 bg-green-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500" />
                Active Users Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {realTimeStats.activeUsers.total}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {realTimeStats.activeUsers.generating} generating
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Sessions Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {realTimeStats.sessions.today}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                of {realTimeStats.sessions.total} total
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/50 bg-purple-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-500" />
                Cost Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">
                ${realTimeStats.cost.today.toFixed(3)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                ${realTimeStats.cost.total.toFixed(3)} total
              </p>
            </CardContent>
          </Card>

          <Card className={`border-${realTimeStats.errors.rate > 10 ? 'red' : 'yellow'}-500/50 bg-${realTimeStats.errors.rate > 10 ? 'red' : 'yellow'}-500/5`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className={`w-4 h-4 text-${realTimeStats.errors.rate > 10 ? 'red' : 'yellow'}-500`} />
                Error Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold text-${realTimeStats.errors.rate > 10 ? 'red' : 'yellow'}-500`}>
                {realTimeStats.errors.rate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {realTimeStats.errors.lastHour} errors last hour
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Platform Stats */}
      {(totalPapers != null || totalUsers != null) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-indigo-500/50 bg-indigo-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-indigo-500" />
                Registered Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-500">{totalUsers ?? 0}</div>
            </CardContent>
          </Card>

          <Card className="border-teal-500/50 bg-teal-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-500" />
                Total Papers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-teal-500">{totalPapers ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {visiblePapers ?? 0} visible in journal
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                Shared Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">{metrics.totalSessions}</div>
              <p className="text-xs text-muted-foreground mt-1">total sessions</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Historical Overview Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Cumulative Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ${metrics.totalCost.toFixed(4)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {metrics.totalSessions} sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.totalTokens.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.totalInputTokens.toLocaleString()} in / {metrics.totalOutputTokens.toLocaleString()} out
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Cost/Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${metrics.averageCostPerSession.toFixed(4)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Per conversation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Model</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                Sonnet 4.5
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                $3/$15 per M tokens
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
