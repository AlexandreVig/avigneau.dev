import {
  createMenuBar,
  type MenuBarOptions,
  type MenuSchema,
} from '../../lib/menubar';

type Difficulty = 'Beginner' | 'Intermediate' | 'Expert';

export type MinesweeperMenuAction =
  | 'new'
  | 'exit'
  | 'about'
  | `difficulty:${Difficulty}`;

const SCHEMA: MenuSchema = {
  Game: [
    { type: 'item', text: 'New', action: 'new' },
    { type: 'separator' },
    { type: 'item', text: 'Beginner', action: 'difficulty:Beginner' },
    { type: 'item', text: 'Intermediate', action: 'difficulty:Intermediate' },
    { type: 'item', text: 'Expert', action: 'difficulty:Expert' },
    { type: 'separator' },
    { type: 'item', text: 'Exit', action: 'exit' },
  ],
  Help: [{ type: 'item', text: 'About Minesweeper', action: 'about' }],
};

export type MenuOptions = Omit<MenuBarOptions, 'schema' | 'logo'>;

export function createMenu(opts: MenuOptions, signal: AbortSignal): HTMLElement {
  return createMenuBar({ ...opts, schema: SCHEMA }, signal);
}
