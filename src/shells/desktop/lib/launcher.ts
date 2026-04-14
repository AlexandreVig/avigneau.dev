import { appHost } from '../apps/host';
import { readFile, resolve } from '../../../fs/api';
import type { FileHandle } from '../../../fs/types';
import { getFileType } from './fileTypes';

export interface LaunchRequest {
  /** Launch a specific app. Optional if `path` is given — file type resolves it. */
  appId?: string;
  /** Launch with a file, or a start path for a folder-aware singleton app. */
  path?: string;
  /** Extra arguments passed into the app's mount context (e.g. explorer start path). */
  args?: Record<string, unknown>;
}

/**
 * Single entry point for opening anything — apps, files, shortcuts.
 * All UI surfaces (desktop icons, start menu, explorer, taskbar shortcuts)
 * route through here.
 *
 * Path interpretation:
 *   - If the path resolves to a **file**, it becomes the FileHandle passed to
 *     the app (document apps use this; file type drives default-app lookup).
 *   - If the path resolves to a **folder** (or any non-file node) and `appId`
 *     is explicit, the path is forwarded as `args.path` — used by explorer to
 *     pick its starting directory.
 */
export async function launch(req: LaunchRequest): Promise<void> {
  let file: FileHandle | null = null;
  let args = req.args;

  if (req.path) {
    const node = resolve(req.path);
    if (node?.kind === 'file') {
      file = await readFile(req.path);
    } else if (req.appId) {
      // Folder / unresolved path + explicit app → pass as args.
      args = { ...(args ?? {}), path: req.path };
    } else {
      console.warn(`[shell] no file at "${req.path}"`);
      return;
    }
  }

  const appId = req.appId ?? (file ? getFileType(file.ext).defaultAppId : null);
  if (!appId) {
    console.warn('[shell] launch called with neither appId nor resolvable path');
    return;
  }

  await appHost.launch({ appId, file, args });
}
