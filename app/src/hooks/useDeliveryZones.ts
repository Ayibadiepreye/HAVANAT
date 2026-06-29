// Convenience hook: read the active delivery zones from the admin-managed store
// and shape them into a { state -> fee } map for the cart / checkout.

import { useEffect, useMemo } from 'react';
import { useDeliveryZoneStore } from '@/stores/useDeliveryZoneStore';
import { CONFIG } from '@/config';

export interface DeliveryZoneView {
  state: string;
  fee: number;
  eta: string;
}

export function useDeliveryZones(): { zoneFeeByState: Record<string, number>; zones: DeliveryZoneView[] } {
  const zones = useDeliveryZoneStore((s) => s.zones);
  const fetchZones = useDeliveryZoneStore((s) => s.fetchZones);
  
  // Fetch zones on first use
  useEffect(() => {
    if (zones.length === 0) {
      void fetchZones();
    }
  }, [zones.length, fetchZones]);
  
  return useMemo(() => {
    const map: Record<string, number> = {};
    const list: DeliveryZoneView[] = zones.map((z) => {
      map[z.state || 'default'] = z.fee;
      return { state: z.state, fee: z.fee, eta: z.eta };
    });
    // Default fallback in case admin hasn't added a zone for the customer's state
    if (!map['default']) map['default'] = CONFIG.DEFAULT_DELIVERY_FEE;
    return { zoneFeeByState: map, zones: list };
  }, [zones]);
}