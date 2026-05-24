import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CCN Cable Network',
    short_name: 'CCN Cable',
    description: 'Fast, secure, and hassle-free cable recharge',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a1a2e',
    theme_color: '#1a1a2e',
    icons: [
      {
        src: '/logo.jpg',
        sizes: '192x192 512x512',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
    ],
  };
}
