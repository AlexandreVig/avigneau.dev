/**
 * Live registry of mounted explorer instances.
 *
 * The explorer's `mount()` registers an instance with a `getPath()` accessor;
 * the manifest's `findExistingInstance()` walks the registry to look up an
 * already-open window showing a requested folder.
 *
 * This module is intentionally tiny so it can be imported eagerly from
 * `apps/registry.ts` without dragging the explorer chunk into the initial
 * bundle.
 */

export const explorerInstances = new Map<string, () => string>();

/** Find an open explorer instance currently displaying `path`, or null. */
export function findExplorerInstanceAt(path: string): string | null {
  for (const [id, getPath] of explorerInstances) {
    if (getPath() === path) return id;
  }
  return null;
}
