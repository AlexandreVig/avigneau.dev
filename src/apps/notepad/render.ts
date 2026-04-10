/**
 * Lazy-loaded markdown → HTML renderer. `marked` is dynamic-imported so the
 * parser only ships in the notepad chunk, not in the initial bundle.
 *
 * The configured marked instance is cached after first initialization so
 * marked.use() is only called once — calling it repeatedly stacks extensions
 * and causes highlight.js HTML to be double-escaped.
 */

type MarkedParseFn = (src: string, opts?: { async: false }) => string;
let parse: MarkedParseFn | null = null;

async function getParser(): Promise<MarkedParseFn> {
  if (parse) return parse;

  const [{ marked }, { markedHighlight }, { default: hljs }] = await Promise.all([
    import('marked'),
    import('marked-highlight'),
    import('./highlight'),
  ]);

  marked.use(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
    }),
  );

  marked.use({
    renderer: {
      link({ href, title, text }) {
        return `<a href="${href}" target="_blank" rel="noreferrer">${title ? ` title="${title}>"` : ''}${text}</a>`;
      },
    },
  });

  parse = (src, opts) => marked.parse(src, opts) as string;
  return parse;
}

export async function renderMarkdown(source: string): Promise<string> {
  const parser = await getParser();
  return parser(source, { async: false });
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
