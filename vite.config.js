import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/lib/**', 'src/components/**'],
      exclude: ['src/lib/docxGenerators.js', 'src/lib/xlsxGenerators.js', 'src/lib/pptxGenerators.js', 'src/lib/atlassianGenerators.js'],
    },
  },
})
