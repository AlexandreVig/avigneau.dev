/**
 * Lightweight markdown → HTML renderer for iPod apps.
 *
 * Thinner than the desktop notepad's renderer (no syntax highlighting, no
 * code-block extensions — mobile previews don't need them) so the iPod
 * bundle stays small. `marked` is dynamic-imported so the parser only
 * ships in the chunk of the first app that calls this.
 */

type MarkedParseFn = (src: string, opts?: { async: false }) => string;
let parse: MarkedParseFn | null = null;

async function getParser(): Promise<MarkedParseFn> {
  if (parse) return parse;

  const { marked } = await import('marked');

  marked.use({
    renderer: {
      link({ href, title, text }) {
        const safeHref = href ? href.replace(/"/g, '&quot;') : '';
        const titleAttr = title
          ? ` title="${title.replace(/"/g, '&quot;')}"`
          : '';
        return `<a href="${safeHref}"${titleAttr} target="_blank" rel="noreferrer noopener">${text}</a>`;
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
