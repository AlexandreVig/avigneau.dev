/**
 * Lazy-loaded markdown → HTML renderer. `marked` is dynamic-imported so the
 * parser only ships in the notepad chunk, not in the initial bundle.
 */
export async function renderMarkdown(source: string): Promise<string> {
  const { marked } = await import('marked');

  marked.use({
    renderer: {
      link({ href, title, text }) {
        return `<a href="${href}" target="_blank" rel="noreferrer">${title ? ` title="${title}>"` : ''}${text}</a>`;
      }
    }
  });

  return marked.parse(source, { async: false }) as string;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
