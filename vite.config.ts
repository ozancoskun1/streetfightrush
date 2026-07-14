import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

const BASE_PATH = './';

function publicAssetBasePathPlugin(): Plugin {
  return {
    name: 'public-asset-base-path',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('node_modules') || !/\.[jt]sx?$/.test(id)) {
        return null;
      }

      const rewritten = code.replace(
        /([`'"])\/(characters|backgrounds|images|icons|sounds|audio|music)\//g,
        '$1./$2/',
      );

      if (rewritten === code) {
        return null;
      }

      return {
        code: rewritten,
        map: null,
      };
    },
  };
}

export default defineConfig(() => {
  return {
    base: BASE_PATH,
    plugins: [publicAssetBasePathPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
