import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NovaCode AI',
    short_name: 'NovaCode',
    description: 'Professional AI-powered Code Editor and WebContainer environment.',
    start_url: '/',
    display: 'standalone',
    background_color: '#05070a',
    theme_color: '#37d5ff',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
