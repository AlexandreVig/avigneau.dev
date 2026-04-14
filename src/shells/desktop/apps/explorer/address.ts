/**
 * Address-bar path helpers.
 *
 * The VFS uses POSIX-style paths ("/Desktop/About Me.md") but the explorer
 * surfaces them in Windows XP form: "My Computer" for the root, and
 * back-slash-separated segments for everything else (e.g. "My Documents\Projects").
 */

import { resolve, root } from '../../../../fs/api';
import type { FsNode } from '../../../../fs/types';

const MY_COMPUTER = 'My Computer';

/** Convert a VFS path into the form shown in the address bar. */
export function displayPathFor(vfsPath: string): string {
  if (vfsPath === '/' || vfsPath === '') return MY_COMPUTER;
  return vfsPath.replace(/^\//, '').replaceAll('/', '\\');
}

/**
 * Parse user input from the address bar back into a VFS path.
 *
 * XP behavior we mimic:
 *  - Always absolute. Typing "My Documents" navigates to /My Documents
 *    regardless of where you currently are.
 *  - Case-insensitive segment matching.
 *  - Forward and back slashes are interchangeable.
 *  - "My Computer" (with or without a trailing slash) means root.
 *
 * Returns null when no segment chain matches.
 */
export function parseAddress(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Strip a "My Computer" prefix and any leading slashes/separators.
  let rest = trimmed.replace(/\\/g, '/');
  rest = rest.replace(/^\/?my computer\/?/i, '');
  rest = rest.replace(/^\/+/, '');
  rest = rest.replace(/\/+$/, '');

  if (rest === '') return '/';

  const segments = rest.split('/').filter(Boolean);
  let node: FsNode = root;
  const canonical: string[] = [];

  for (const seg of segments) {
    if (node.kind !== 'folder') return null;
    const lower = seg.toLowerCase();
    const match: FsNode | undefined = node.children.find(
      (c) => c.name.toLowerCase() === lower,
    );
    if (!match) return null;
    canonical.push(match.name);
    node = match;
  }

  const path = '/' + canonical.join('/');
  return resolve(path) ? path : null;
}

/** Pick the small icon shown to the left of the address text. */
export function iconFor(vfsPath: string): string {
  if (vfsPath === '/') return '/icons/my-computer-16.png';
  const node = resolve(vfsPath);
  if (!node) return '/icons/folder-16.png';
  if (node.kind === 'folder') return '/icons/folder-16.png';
  return node.icon ?? '/icons/folder-16.png';
}

export interface TreeEntry {
  /** VFS path this row navigates to. */
  path: string;
  /** Label shown in the dropdown row. */
  display: string;
  /** Indent level — 0 for the topmost row. */
  depth: number;
  /** Small icon shown to the left. */
  icon: string;
}

/**
 * Build the hierarchical list of folder locations shown in the address
 * dropdown. Mirrors the XP shell namespace: a single "My Computer" root
 * with the VFS folders nested underneath.
 *
 * Files and shortcuts are skipped — the dropdown is a folder navigator.
 */
export function buildLocationTree(): TreeEntry[] {
  const entries: TreeEntry[] = [
    { path: '/', display: MY_COMPUTER, depth: 0, icon: iconFor('/') },
  ];

  function walk(node: FsNode, path: string, depth: number): void {
    if (node.kind !== 'folder') return;
    for (const child of node.children) {
      if (child.kind !== 'folder') continue;
      const childPath = path === '/' ? `/${child.name}` : `${path}/${child.name}`;
      entries.push({
        path: childPath,
        display: child.name,
        depth,
        icon: iconFor(childPath),
      });
      walk(child, childPath, depth + 1);
    }
  }

  walk(root, '/', 1);
  return entries;
}
