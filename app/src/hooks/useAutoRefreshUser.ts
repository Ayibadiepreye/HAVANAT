// Hook to auto-refresh user data periodically for customer pages
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

interface UseAutoRefreshUserOptions {
  enabled?: boolean;
  intervalMs?: number; // Default: 30 seconds
}

/**
 * Auto-refreshes user data at regular intervals to keep customer pages in sync
 * Useful after payments, tier changes, or any backend updates
 */
export function useAutoRefreshUser(options: UseAutoRefreshUserOptions = {}) {
  const { enabled = true, intervalMs = 30000 } = options;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchUserData = useAuthStore((s) => s.fetchUserData);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Fetch immediately on mount
    void fetchUserData();

    // Set up interval for periodic refresh
    intervalRef.current = setInterval(() => {
      void fetchUserData();
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, isAuthenticated, fetchUserData, intervalMs]);
}
