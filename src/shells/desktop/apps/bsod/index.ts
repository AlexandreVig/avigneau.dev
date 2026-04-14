import type { AppModule, AppMountContext } from '../types';
import './bsod.css';

const bsod: AppModule = {
  mount(ctx: AppMountContext) {
    // Close the window immediately — the BSOD is a fullscreen overlay, not a window.
    ctx.host.close();

    const overlay = document.createElement('div');
    overlay.className = 'bsod';
    overlay.innerHTML = `
      <div class="bsod-header">Windows</div>
      <div class="bsod-body">
        <p>An error has occurred. To continue:</p>
        <p>Press Enter to return to Windows, or</p>
        <p>Press CTRL+ALT+DEL to restart your computer. If you do this,
you will lose any unsaved information in all open applications.</p>
        <p>Error: 0E : 016F : BFF9B3D4</p>
        <div class="bsod-continue">Press any key to continue <span class="bsod-cursor">_</span></div>
      </div>
    `;

    document.body.appendChild(overlay);

    const dismiss = () => {
      overlay.remove();
      cleanup();
    };

    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      dismiss();
    };

    const onClick = () => dismiss();

    const cleanup = () => {
      document.removeEventListener('keydown', onKey);
      overlay.removeEventListener('click', onClick);
    };

    document.addEventListener('keydown', onKey, { once: true });
    overlay.addEventListener('click', onClick, { once: true });
  },
};

export default bsod;
