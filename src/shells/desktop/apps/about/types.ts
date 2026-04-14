/**
 * Args contract for the templated About app.
 *
 * Any app that wants an "About …" dialog launches the `about` app with these
 * args. The `path` field is used by the host as a synthetic dedupe key so that
 * each parent app gets at most one About window at a time (see
 * `AppHost.computeInstanceId` in src/apps/host.ts).
 */
export interface AboutArgs {
  /** Dedupe key, e.g. "about:notepad". Required. */
  path: string;
  /** Overrides the window title-bar icon (honored by host). */
  icon?: string;
  /** Large icon rendered in the dialog body, top-left. */
  appIcon: string;
  /** e.g. "Notepad" — used for the body title AND the window title ("About Notepad"). */
  appTitle: string;
  /** Optional "Version 1.0" line. */
  version?: string;
  /** Optional "© 2026 …" line. */
  copyright?: string;
  /**
   * Optional free-form description paragraph. Supports a minimal Markdown
   * link syntax: `[text](https://example.com)`. Everything else is rendered
   * as plain text (HTML-escaped).
   */
  description?: string;
  /** Optional small footer line above the OK button. */
  footer?: string;
}
