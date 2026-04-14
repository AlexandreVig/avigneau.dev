import type { IpodAppHostAPI } from '../apps/types';
import type { IpodNavigator } from './navigator';

/**
 * The subset of an AppFrame that the host needs to mutate.
 *
 * Kept as a narrow structural interface (rather than importing a concrete
 * AppFrame type) so navigator.ts and ipod-host.ts stay independent of how
 * the frame is implemented — that lands in Step 7.
 */
export interface IpodHostTarget {
  /** Update the nav-bar title shown above the running app. */
  setNavBarTitle(title: string): void;
}

/**
 * Create an `AppHostAPI` instance bound to a single running iPod app.
 *
 * Returned object is the shell-side half of the app lifecycle contract:
 * apps receive it as `AppMountContext.host` and use it to mutate their
 * own frame (title bar) or request their own closure.
 *
 * - `setTitle` → updates the nav-bar title via `target`.
 * - `setIcon`  → no-op; iPod nav bars don't surface an icon.
 * - `close`    → delegates to `navigator.goHome()`, which unmounts the top
 *                app and plays the slide-down animation (wired in Step 7).
 */
export function createIpodHost(
  target: IpodHostTarget | null,
  navigator: IpodNavigator,
): IpodAppHostAPI {
  return {
    setTitle(title) {
      target?.setNavBarTitle(title);
    },
    setIcon() {
      // iPod nav bars don't surface an icon.
    },
    close() {
      navigator.goHome();
    },
  };
}
