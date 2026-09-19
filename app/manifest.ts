import { MetadataRoute } from 'next';
import { getCurrentOperator } from '@/lib/db/tenant';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const op = await getCurrentOperator();
  const name = op?.name ?? 'Chandni Cable Network';

  return {
    name,
    short_name: name,
    description: 'Fast, secure, and hassle-free cable recharge',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a1a2e',
    theme_color: '#1a1a2e',
    icons: [
      {
        src: op?.logo_url || '/logo.jpg',
        sizes: '192x192 512x512',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
    ],
  };
}
