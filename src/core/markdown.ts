/**
 * Lazy-loaded markdown → HTML renderer. `marked` is dynamic-imported so the
 * parser only ships in the notepad chunk, not in the initial bundle.
 *
 * The configured marked instance is cached after first initialization so
 * marked.use() is only called once — calling it repeatedly stacks extensions
 * and causes highlight.js HTML to be double-escaped.
 *
 * Mermaid diagrams are rendered client-side: fenced ```mermaid blocks are
 * emitted as <div class="mermaid"> nodes, and mermaid is lazy-imported once
 * to process them after the HTML is inserted into the DOM.
 */

type MarkedParseFn = (src: string, opts?: { async: false }) => string;
let parse: MarkedParseFn | null = null;
let mermaidInitialized = false;

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
        if (lang === 'mermaid') return code;
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
    }),
  );

  marked.use({
    renderer: {
      code({ text, lang }) {
        if (lang === 'mermaid') {
          return `<div class="mermaid">${text}</div>`;
        }
        // Fall through to default renderer.
        return false as unknown as string;
      },
      link({ href, title, text }) {
        const safeHref = href ? href.replace(/"/g, '&quot;') : '';
        const titleAttr = title ? ` title="${title.replace(/"/g, '&quot;')}"` : '';
        return `<a href="${safeHref}"${titleAttr} target="_blank" rel="noreferrer">${text}</a>`;
      },
    },
  });

  parse = (src, opts) => marked.parse(src, opts) as string;
  return parse;
}

/**
 * Run Mermaid on any `.mermaid` divs inside `container`.
 * Safe to call multiple times — Mermaid is only initialized once.
 */
async function renderMermaidIn(container: Element): Promise<void> {
  const nodes = container.querySelectorAll<HTMLElement>('.mermaid');
  if (nodes.length === 0) return;

  const { default: mermaid } = await import('mermaid');

  if (!mermaidInitialized) {
    mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
    mermaidInitialized = true;
  }

  await mermaid.run({ nodes });
}

export async function renderMarkdown(source: string): Promise<string> {
  const parser = await getParser();
  return parser(source, { async: false });
}

export { renderMermaidIn };
