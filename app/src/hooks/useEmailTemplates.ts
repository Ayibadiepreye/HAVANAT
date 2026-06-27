// Email templates hook — loads live from backend.
//
// Returns the 4 email templates (order_confirmation, order_shipped, etc.)
// from GET /api/content/email-templates. Future: add a save mutation once
// the admin UI supports template editing.

import { useEffect, useState, useCallback } from 'react';
import { apiGet } from '@/lib/api';

export interface EmailTemplate {
  id: number;
  key: string;
  subject: string;
  body: string;
  updatedAt: string;
}

export function useEmailTemplates() {
  const [data, setData] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ items: EmailTemplate[] }>('/api/content/email-templates', true);
      setData(res.items ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load email templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}