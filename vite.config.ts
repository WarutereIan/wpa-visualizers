import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import tsconfigPaths from 'vite-tsconfig-paths'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => ({
  plugins:
    mode === 'test'
      ? [tsconfigPaths({ projects: ['./tsconfig.json'] })]
      : [
          devtools(),
          tsconfigPaths({ projects: ['./tsconfig.json'] }),
          tailwindcss(),
          tanstackStart(),
          nitro({ preset: 'vercel' }),
          viteReact(),
        ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
