import { resolve } from 'path';
import { defineConfig } from 'vite';
import htmlIncludes from './plugins/vite-plugin-html-includes.js';

export default defineConfig({
  plugins: [htmlIncludes()],
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        forms: resolve(__dirname, 'pages/forms.html'),
        payment: resolve(__dirname, 'pages/payment.html'),
        'thank-you': resolve(__dirname, 'pages/thank-you.html'),
        shop: resolve(__dirname, 'pages/shop.html'),
        about: resolve(__dirname, 'pages/about.html'),
        blog: resolve(__dirname, 'pages/blog.html'),
        contact: resolve(__dirname, 'pages/contact.html'),
        faq: resolve(__dirname, 'pages/faq.html'),
        terms: resolve(__dirname, 'pages/terms.html'),
        privacy: resolve(__dirname, 'pages/privacy.html'),
        careers: resolve(__dirname, 'pages/careers.html'),
        product: resolve(__dirname, 'pages/product.html'),
        '404': resolve(__dirname, 'pages/404.html'),
      },
    },
  },
  server: {
    open: true,
    port: 5173,
  },
});
