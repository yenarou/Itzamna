import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // host: true allows access from outside the container (Docker Compose).
  server: {
    host: true,
    port: 4321,
    allowedHosts: [
      'app.itzamna.earth',
      'itzamna.earth'
    ]
  },
  vite: {
    plugins: [tailwindcss()]
  },
  devToolbar: { enabled: false },
  vite: { plugins: [tailwindcss()] },
});
