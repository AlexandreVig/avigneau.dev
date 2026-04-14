import { launch } from '../../lib/launcher';
import type { AboutArgs } from './types';

export function openAbout(appId: string, fields: Omit<AboutArgs, 'path'>): void {
  void launch({
    appId: 'about',
    args: {
      path: `about:${appId}`,
      ...fields,
    },
  });
}
