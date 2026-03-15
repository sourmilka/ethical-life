import { readFileSync } from 'fs';
import { resolve } from 'path';

export default function htmlIncludes() {
  let root;

  return {
    name: 'html-includes',
    enforce: 'pre',

    configResolved(config) {
      root = config.root;
    },

    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        // Resolve @@include directives
        let result = html.replace(
          /@@include\(['"](.+?)['"]\)/g,
          (_, filePath) => {
            const absPath = resolve(root, filePath);
            try {
              return readFileSync(absPath, 'utf-8');
            } catch {
              console.error(`[html-includes] Not found: ${filePath}`);
              return `<!-- include not found: ${filePath} -->`;
            }
          },
        );

        // For sub-pages (pages/*.html), rewrite relative asset paths
        // so Vite resolves them from the project root, not the page dir.
        if (ctx.filename && !ctx.filename.replace(/\\/g, '/').endsWith('/index.html')) {
          result = result.replace(
            /(?:src|href)=(["'])src\//g,
            (match, q) => match.replace(`${q}src/`, `${q}/src/`),
          );
        }

        return result;
      },
    },

    handleHotUpdate({ file, server }) {
      if (file.includes('partials')) {
        server.ws.send({ type: 'full-reload' });
      }
    },
  };
}
