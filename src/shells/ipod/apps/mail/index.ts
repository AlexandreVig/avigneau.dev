/**
 * iPod Mail — compose-a-new-message screen that posts to the same
 * `/api/contact` endpoint the desktop Outlook Compose window uses.
 * Mirrors that module's flow (honeypot, sending/sent/error states) so
 * both shells go through the same validated path.
 */

import type { IpodAppModule } from '../types';
import { t } from '../../../../i18n';
import './mail.css';

const mod: IpodAppModule = {
  mount({ root, host, signal }) {
    host.setTitle(t('ipod.mail.title'));
    root.classList.add('ipod-mail');

    root.innerHTML = `
      <form class="ipod-mail__form" novalidate>
        <label class="ipod-mail__field">
          <span class="ipod-mail__label">${t('ipod.mail.field.from')}</span>
          <input name="name" type="text" required autocomplete="name" placeholder="${t('compose.placeholder.name')}" />
        </label>
        <label class="ipod-mail__field">
          <span class="ipod-mail__label">${t('ipod.mail.field.email')}</span>
          <input name="email" type="email" required autocomplete="email" placeholder="${t('compose.placeholder.email')}" />
        </label>
        <label class="ipod-mail__field">
          <span class="ipod-mail__label">${t('ipod.mail.field.subject')}</span>
          <input name="subject" type="text" required placeholder="${t('compose.placeholder.subject')}" />
        </label>
        <label class="ipod-mail__field ipod-mail__field--grow">
          <span class="ipod-mail__label">${t('ipod.mail.field.message')}</span>
          <textarea name="message" required placeholder="${t('ipod.mail.placeholder.message')}" rows="6"></textarea>
        </label>
        <label class="ipod-mail__honeypot" aria-hidden="true">
          Website<input name="website" type="text" tabindex="-1" autocomplete="off" />
        </label>
        <div class="ipod-mail__status" role="status"></div>
        <button type="submit" class="ipod-mail__send">${t('ipod.mail.send')}</button>
      </form>
    `;

    const form = root.querySelector<HTMLFormElement>('.ipod-mail__form')!;
    const statusEl = root.querySelector<HTMLElement>('.ipod-mail__status')!;
    const sendBtn = root.querySelector<HTMLButtonElement>('.ipod-mail__send')!;
    const honeypot = form.elements.namedItem('website') as HTMLInputElement;
    const nameInput = form.elements.namedItem('name') as HTMLInputElement;
    const emailInput = form.elements.namedItem('email') as HTMLInputElement;
    const subjectInput = form.elements.namedItem('subject') as HTMLInputElement;
    const messageArea = form.elements.namedItem('message') as HTMLTextAreaElement;

    let sending = false;

    const setStatus = (text: string, isError = false) => {
      statusEl.textContent = text;
      statusEl.classList.toggle('ipod-mail__status--error', isError);
    };

    const setDisabled = (disabled: boolean) => {
      [nameInput, emailInput, subjectInput, messageArea, sendBtn].forEach(
        (el) => {
          el.disabled = disabled;
        },
      );
    };

    const validate = (): string | null => {
      if (!nameInput.value.trim()) return t('compose.validation.name');
      if (!emailInput.value.trim()) return t('compose.validation.email');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()))
        return t('compose.validation.emailInvalid');
      if (!subjectInput.value.trim()) return t('compose.validation.subject');
      if (!messageArea.value.trim()) return t('compose.validation.message');
      if (nameInput.value.length > 80) return t('compose.validation.nameTooLong');
      if (subjectInput.value.length > 120) return t('compose.validation.subjectTooLong');
      if (messageArea.value.length > 4000) return t('compose.validation.messageTooLong');
      return null;
    };

    form.addEventListener(
      'submit',
      async (e) => {
        e.preventDefault();
        if (sending) return;

        const error = validate();
        if (error) {
          setStatus(error, true);
          return;
        }

        // Silently swallow bot submissions — show "sent" so they don't retry.
        if (honeypot.value) {
          setStatus(t('compose.status.sent'));
          return;
        }

        sending = true;
        setDisabled(true);
        setStatus(t('compose.status.sending'));

        try {
          const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: nameInput.value.trim(),
              email: emailInput.value.trim(),
              subject: subjectInput.value.trim(),
              message: messageArea.value.trim(),
              website: honeypot.value,
            }),
            signal,
          });
          const data = (await res.json()) as { ok?: boolean; error?: string };

          if (res.ok && data.ok) {
            setStatus(t('compose.status.sent'));
            window.setTimeout(() => host.close(), 1200);
          } else {
            setStatus(data.error ?? t('compose.status.error'), true);
            setDisabled(false);
            sending = false;
          }
        } catch (err) {
          if (signal.aborted) return;
          console.error('[ipod/mail] network error', err);
          setStatus(t('compose.status.networkError'), true);
          setDisabled(false);
          sending = false;
        }
      },
      { signal },
    );

    return {
      unmount() {
        root.classList.remove('ipod-mail');
        root.innerHTML = '';
      },
    };
  },
};

export default mod;
