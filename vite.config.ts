import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  root: "./playground",
  server: {
    port: 4321,
  },
  plugins: [vue()],
});
