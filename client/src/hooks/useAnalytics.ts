import { useEffect, useRef } from 'react';

/**
 * Hook to send heartbeat to analytics server
 * Tracks user activity and current generation status
 */
export function useAnalytics(status: 'idle' | 'generating' | 'error', currentQuery?: string) {
  const sessionIdRef = useRef<string>(getOrCreateSessionId());
  const lastStatusRef = useRef<string>(status);

  useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/analytics/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            status,
            currentQuery: currentQuery || null,
            userId: null, // TODO: Get from auth context if logged in
          }),
        });
      } catch (error) {
        console.error('Failed to send heartbeat:', error);
      }
    };

    // Send heartbeat immediately when status changes
    if (status !== lastStatusRef.current) {
      sendHeartbeat();
      lastStatusRef.current = status;
    }

    // Send heartbeat every 30 seconds while generating
    if (status === 'generating') {
      const interval = setInterval(sendHeartbeat, 30000);
      return () => clearInterval(interval);
    }
  }, [status, currentQuery]);

  return {
    sessionId: sessionIdRef.current,
  };
}

/**
 * Get or create a unique session ID for this browser session
 */
function getOrCreateSessionId(): string {
  const key = 'vibequant_session_id';
  let sessionId = sessionStorage.getItem(key);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}

/**
 * Hook to fetch real-time analytics stats (public endpoint)
 */
export function useRealTimeStats(refreshInterval: number = 10000) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/analytics/real-time-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch real-time stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { stats, loading };
}

// Helper to import useState
import { useState } from 'react';
