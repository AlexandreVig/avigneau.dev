import { getFileType } from '../lib/fileTypes';
import { root } from './tree';
import type { FileHandle, FileNode, FolderNode, FsNode } from './types';

/** Split a VFS path into segments. "/" → []. "/Desktop/A.md" → ["Desktop","A.md"]. */
function segments(path: string): string[] {
  return path.split('/').filter(Boolean);
}

/** Walk the tree from `root` and return the node at `path`, or null. */
export function resolve(path: string): FsNode | null {
  const segs = segments(path);
  let current: FsNode = root;
  for (const seg of segs) {
    if (current.kind !== 'folder') return null;
    const next = current.children.find((c) => c.name === seg);
    if (!next) return null;
    current = next;
  }
  return current;
}

/** List children of a folder node at `path`. Returns [] if not a folder. */
export function listChildren(path: string): FsNode[] {
  const node = resolve(path);
  if (!node || node.kind !== 'folder') return [];
  return node.children;
}

/** Parent path of a given path. `/Desktop/A.md` → `/Desktop`. `/` → `/`. */
export function parentPath(path: string): string {
  const segs = segments(path);
  if (segs.length === 0) return '/';
  segs.pop();
  return '/' + segs.join('/');
}

/** Canonicalize a VFS path. */
export function joinPath(parent: string, name: string): string {
  const segs = segments(parent);
  segs.push(name);
  return '/' + segs.join('/');
}

/**
 * Resolve a file node by path and return a FileHandle with memoized read().
 * Returns null if the path doesn't resolve to a file.
 */
export async function readFile(path: string): Promise<FileHandle | null> {
  const node = resolve(path);
  if (!node || node.kind !== 'file') return null;
  return makeFileHandle(path, node);
}

export function makeFileHandle(path: string, node: FileNode): FileHandle {
  const type = getFileType(node.ext);
  let cached: Promise<string> | null = null;
  return {
    path,
    name: node.name,
    ext: node.ext,
    icon: node.icon || type.icon,
    read() {
      if (!cached) cached = node.load();
      return cached;
    },
  };
}

/** Icon helper: uses the node's own icon, or falls back to the file-type registry / folder default. */
export function iconForNode(node: FsNode): string {
  if (node.icon) return node.icon;
  if (node.kind === 'file') return getFileType(node.ext).icon;
  if (node.kind === 'folder') return '/icons/folder-32.png';
  return '/icons/file-unknown.png';
}

/** List the Desktop folder contents — used by Desktop.astro. */
export function desktopNodes(): FsNode[] {
  return listChildren('/Desktop');
}

/**
 * Given a parent path and a child node, return its full canonical path.
 * Used by Desktop.astro when rendering icons.
 */
export function pathOf(parent: string, node: FsNode): string {
  return joinPath(parent, node.name);
}

/** Exported so other modules can treat the root FolderNode uniformly. */
export { root };
export type { FolderNode, FileNode, FsNode, FileHandle };
