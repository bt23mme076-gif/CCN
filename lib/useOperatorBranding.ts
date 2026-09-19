'use client';

import { useEffect, useState } from 'react';

export interface OperatorBranding {
  name: string;
  logo_url: string | null;
  primary_color: string;
  tagline: string | null;
  support_phone: string | null;
}

const DEFAULT_BRANDING: OperatorBranding = {
  name: 'Chandni Cable Network',
  logo_url: null,
  primary_color: '#6366f1',
  tagline: null,
  support_phone: null,
};

// Client-side counterpart to lib/db/tenant.ts's getCurrentOperator() — fetches
// the current subdomain's operator branding so client components don't show
// another operator's hardcoded name/logo.
export function useOperatorBranding(): OperatorBranding {
  const [branding, setBranding] = useState<OperatorBranding>(DEFAULT_BRANDING);

  useEffect(() => {
    fetch('/api/operator/branding')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.name) setBranding(data); })
      .catch(() => {});
  }, []);

  return branding;
}
