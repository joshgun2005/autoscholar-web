import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, Database, FileText, MessageSquare, Trash2, Sparkles, DollarSign, TrendingUp, Users as UsersIcon, Activity, Zap, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  displayName: string;
  createdAt: string;
}

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

interface UserMetric {
  userId: string;
  displayName: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  sessionCount: number;
}

interface Metrics {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  totalSessions: number;
  averageCostPerSession: number;
  userMetrics: UserMetric[];
}

interface DatabaseData {
  users: User[];
  sessions: Session[];
  sharedReports: SharedReport[];
  metrics: Metrics;
}

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

export default function Admin() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [databaseData, setDatabaseData] = useState<DatabaseData | null>(null);
  const [activeUsersData, setActiveUsersData] = useState<ActiveUsersData | null>(null);
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-login on mount (no password required)
  useEffect(() => {
    const autoLogin = async () => {
      try {
        const response = await fetch("/api/admin/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        if (response.ok) {
          setIsAuthenticated(true);
          await refreshAllData();
        }
      } catch (err) {
        console.error("Auto-login failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    autoLogin();
  }, []);

  // Auto-refresh data every 10 seconds if enabled
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;

    const interval = setInterval(() => {
      refreshAllData();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to login");
      }

      setIsAuthenticated(true);
      await loadDatabaseData();
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDatabaseData = async () => {
    try {
      const response = await fetch("/api/admin/database");

      if (!response.ok) {
        if (response.status === 403) {
          setIsAuthenticated(false);
          return;
        }
        throw new Error("Failed to load database data");
      }

      const data = await response.json();
      setDatabaseData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load database data");
    }
  };

  const loadActiveUsers = async () => {
    try {
      const response = await fetch("/api/analytics/active-users");

      if (response.ok) {
        const data = await response.json();
        setActiveUsersData(data);
      }
    } catch (err: any) {
      console.error("Failed to load active users:", err);
    }
  };

  const loadRealTimeStats = async () => {
    try {
      const response = await fetch("/api/analytics/real-time-stats");

      if (response.ok) {
        const data = await response.json();
        setRealTimeStats(data);
      }
    } catch (err: any) {
      console.error("Failed to load real-time stats:", err);
    }
  };

  const refreshAllData = async () => {
    await Promise.all([
      loadDatabaseData(),
      loadActiveUsers(),
      loadRealTimeStats(),
    ]);
  };

  const deleteSession = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/sessions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete session");
      }

      await loadDatabaseData();
    } catch (err: any) {
      setError(err.message || "Failed to delete session");
    }
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shared report?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/reports/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete report");
      }

      await loadDatabaseData();
    } catch (err: any) {
      setError(err.message || "Failed to delete report");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Show loading screen during auto-login
  if (!isAuthenticated && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Database className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col relative overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
          <div className="container flex h-16 items-center justify-between px-4">
            <button
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 hover-elevate active-elevate-2 px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200"
            >
              <Sparkles className="w-6 h-6 text-primary" />
              <div className="hidden md:flex items-baseline gap-2">
                <span className="text-xl font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  VQuant
                </span>
                <span className="text-sm text-muted-foreground">
                  by Agentilab.ai
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
          <div className="w-full max-w-md">
            <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
                Admin Access
              </h1>
              <p className="text-muted-foreground">
                Enter the admin password to access the database panel
              </p>
            </div>

            <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
              <CardHeader className="space-y-3 pb-6">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Database className="w-5 h-5 text-primary" />
                  Database Administration
                </CardTitle>
                <CardDescription className="text-base">
                  View and manage all database records
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="admin-password" className="text-sm font-medium">Admin Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      placeholder="Enter admin password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 bg-background/50 border-border/50 focus:border-primary transition-all"
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={isLoading}
                  >
                    {isLoading ? "Authenticating..." : "Access Admin Panel"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4">
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 hover-elevate active-elevate-2 px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200"
          >
            <Sparkles className="w-6 h-6 text-primary" />
            <div className="hidden md:flex items-baseline gap-2">
              <span className="text-xl font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                VQuant Admin
              </span>
            </div>
          </button>
          <Button
            variant="outline"
            onClick={() => {
              setIsAuthenticated(false);
              setPassword("");
            }}
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Database className="w-8 h-8 text-primary" />
            Database Administration
          </h1>
          <p className="text-muted-foreground">
            View and manage all database records
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {databaseData && (
          <Tabs defaultValue="metrics" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid w-full max-w-2xl grid-cols-3 h-12 bg-muted/50 backdrop-blur-sm">
                <TabsTrigger value="metrics" className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                  <Activity className="w-4 h-4 mr-2" />
                  Live Metrics
                </TabsTrigger>
                <TabsTrigger value="sessions" className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Sessions ({databaseData.sessions.length})
                </TabsTrigger>
                <TabsTrigger value="reports" className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                  <FileText className="w-4 h-4 mr-2" />
                  Shared Reports ({databaseData.sharedReports.length})
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3">
                <Badge variant={autoRefresh ? "default" : "outline"} className="cursor-pointer" onClick={() => setAutoRefresh(!autoRefresh)}>
                  <RefreshCw className={`w-3 h-3 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
                  Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
                </Badge>
                <Button variant="outline" size="sm" onClick={refreshAllData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Now
                </Button>
              </div>
            </div>

            {/* Metrics Tab */}
            <TabsContent value="metrics" className="mt-6 space-y-6">
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

                  <Card className="border-blue-500/50 bg-blue-500/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        Sessions Today
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-500">
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
                        ${databaseData.metrics.totalCost.toFixed(4)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Across {databaseData.metrics.totalSessions} sessions
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Tokens</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {databaseData.metrics.totalTokens.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {databaseData.metrics.totalInputTokens.toLocaleString()} in / {databaseData.metrics.totalOutputTokens.toLocaleString()} out
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Avg Cost/Session</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        ${databaseData.metrics.averageCostPerSession.toFixed(4)}
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

            </TabsContent>

            {/* Sessions Tab */}
            <TabsContent value="sessions" className="mt-6">
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
                      {databaseData.sessions.map((session) => (
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
                              onClick={() => deleteSession(session.id)}
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
            </TabsContent>

            {/* Shared Reports Tab */}
            <TabsContent value="reports" className="mt-6">
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
                      {databaseData.sharedReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-mono text-xs">{report.shareId}</TableCell>
                          <TableCell className="max-w-md truncate">{report.question}</TableCell>
                          <TableCell>{formatDate(report.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteReport(report.id)}
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
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
