
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Permite acceder desde fuera del contenedor durante el desarrollo.
  server: {
    host: true,
    port: 4321
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [
        'app.itzamna.earth',
        'itzamna.earth'
      ]
    }
  },
  devToolbar: {
    enabled: false
  }
});
