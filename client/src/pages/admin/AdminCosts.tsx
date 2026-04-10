import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Save, Loader2, CheckCircle, AlertTriangle,
  Mail, Clock, UserCircle, MessageSquare, ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CostConfig {
  totalCost: number;
}

interface Donation {
  id: string;
  name: string;
  email: string;
  amount: number;
  message: string | null;
  status: string;
  createdAt: string;
}

export function AdminCosts() {
  const queryClient = useQueryClient();
  const [costInput, setCostInput] = useState("");
  const [initialized, setInitialized] = useState(false);

  const { data: costConfig } = useQuery<CostConfig>({
    queryKey: ["/api/admin/cost-config"],
    queryFn: async () => {
      const r = await fetch("/api/admin/cost-config", { credentials: "include" });
      return r.json();
    },
    refetchInterval: 10000,
  });

  // Initialize input from server value
  if (costConfig && !initialized) {
    setCostInput(String(costConfig.totalCost || ""));
    setInitialized(true);
  }

  const { data: donations = [] } = useQuery<Donation[]>({
    queryKey: ["/api/admin/donations"],
    queryFn: async () => {
      const r = await fetch("/api/admin/donations", { credentials: "include" });
      return r.json();
    },
    refetchInterval: 10000,
  });

  const saveCostMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/cost-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ totalCost: parseFloat(costInput) || 0 }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cost-config"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/donations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/donations"] });
    },
  });

  const totalDonationsPledged = donations.reduce((s, d) => s + d.amount, 0);
  const pendingCount = donations.filter(d => d.status === "pending").length;

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    contacted: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  };

  const nextStatus: Record<string, string> = {
    pending: "contacted",
    contacted: "completed",
    completed: "pending",
  };

  return (
    <div className="space-y-6">
      {/* ═══ TOTAL COST CONFIG ═══ */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Research Cost Tracker</h3>
              <p className="text-xs text-muted-foreground">
                Enter the total cost of all generated papers. This is displayed publicly on the landing page.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-card border border-border/40">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Cost (USD)</div>
              <div className="text-2xl font-bold font-mono text-foreground">
                ${costConfig?.totalCost?.toFixed(2) ?? "0.00"}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border/40">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Donations Pledged</div>
              <div className="text-2xl font-bold font-mono text-emerald-600">
                ${totalDonationsPledged.toFixed(2)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border/40">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Pending Contacts</div>
              <div className="text-2xl font-bold font-mono text-amber-600">{pendingCount}</div>
            </div>
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Update Total Cost (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costInput}
                  onChange={(e) => setCostInput(e.target.value)}
                  placeholder="0.00"
                  className="pl-7 font-mono"
                />
              </div>
            </div>
            <Button
              onClick={() => saveCostMutation.mutate()}
              disabled={saveCostMutation.isPending || !costInput}
              className="gap-2"
            >
              {saveCostMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saveCostMutation.isSuccess ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>

          {saveCostMutation.isError && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Failed to save cost.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ═══ DONATIONS LIST ═══ */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Donation Requests ({donations.length})</h3>
            </div>
            {pendingCount > 0 && (
              <Badge variant="outline" className="text-[10px] gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                {pendingCount} pending
              </Badge>
            )}
          </div>

          {donations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No donation requests yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {donations.map((d) => (
                <div
                  key={d.id}
                  className={cn(
                    "flex items-start gap-4 p-3 rounded-lg border transition-colors",
                    d.status === "pending" ? "bg-amber-500/[0.03] border-amber-500/15" : "bg-card border-border/40"
                  )}
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">{d.name}</span>
                      <Badge
                        variant="outline"
                        className={cn("text-[9px] cursor-pointer", statusColors[d.status])}
                        onClick={() => updateStatusMutation.mutate({ id: d.id, status: nextStatus[d.status] })}
                      >
                        <ArrowUpDown className="h-2.5 w-2.5 mr-0.5" />
                        {d.status}
                      </Badge>
                      <span className="text-lg font-bold font-mono text-primary">${d.amount.toFixed(2)}</span>
                    </div>
                    <a href={`mailto:${d.email}`} className="text-xs text-blue-500 hover:underline">{d.email}</a>
                    {d.message && (
                      <div className="flex items-start gap-1.5 mt-1.5">
                        <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">{d.message}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground/50">
                      <Clock className="h-3 w-3" />
                      {new Date(d.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
