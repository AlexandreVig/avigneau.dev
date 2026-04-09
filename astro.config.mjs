// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // 'static' for full SSG — flip to 'server' when Cloudflare Workers endpoints are needed
  output: 'static',
  adapter: cloudflare(),
});
