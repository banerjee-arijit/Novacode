import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NovaCode AI',
    short_name: 'NovaCode',
    description: 'Professional AI-powered Code Editor. Write, run, and improve code with AI assistance.',
    start_url: '/editor',
    display: 'standalone',
    orientation: 'landscape',
    background_color: '#05070a',
    theme_color: '#37d5ff',
    categories: ['developer tools', 'productivity'],
    icons: [
      {
        src: '/icons/novacode-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/novacode-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
