import tailwindcss from "@tailwindcss/vite";
// @ts-check
import { defineConfig } from 'astro/config';

import icon from "astro-icon";
import node from "@astrojs/node";
import clerk from "@clerk/astro";
import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  vite: {
      plugins: [tailwindcss()],
    },
output:"server",
  integrations: [icon(), clerk()],
  adapter: netlify(),
});