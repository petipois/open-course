import tailwindcss from "@tailwindcss/vite";
// @ts-check
import { defineConfig } from 'astro/config';

import icon from "astro-icon";
import clerk from "@clerk/astro";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  output:"static",
  //output: "server",
  integrations: [icon(), clerk()],
  adapter: node({
    mode: "standalone",
  }),
});