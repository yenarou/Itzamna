import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // host: true permite acceder desde fuera del contenedor (docker compose)
  server: { host: true, port: 4321 },
  vite: { plugins: [tailwindcss()] },
});
