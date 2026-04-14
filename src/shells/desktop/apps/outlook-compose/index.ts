import type { AppModule } from '../types';
import { t } from '../../../../i18n';
import './compose.css';

const mod: AppModule = {
  mount({ root, host, args, signal }) {
    const prefillTo = (args.prefillTo as string) ?? '';
    const prefillEmail = (args.prefillEmail as string) ?? '';

    root.classList.add('compose');
    root.innerHTML = `
      <div class="compose__toolbar">
        <button class="compose__btn compose__btn--send" data-action="send">
          <img src="/icons/outlook/send-recv.png" alt="" />
          <span>${t('compose.send')}</span>
        </button>
        <div class="compose__tsep"></div>
        <button class="compose__btn" disabled>
          <img src="/icons/outlook/delete.png" alt="" />
          <span>${t('compose.cut')}</span>
        </button>
        <button class="compose__btn" disabled>
          <img src="/icons/outlook/find.png" alt="" />
          <span>${t('compose.paste')}</span>
        </button>
        <div class="compose__tsep"></div>
        <button class="compose__btn" disabled>
          <img src="/icons/outlook/print.png" alt="" />
          <span>${t('compose.check')}</span>
        </button>
      </div>

      <div class="compose__fields">
        <div class="compose__field-row">
          <label class="compose__field-label">${t('compose.to')}</label>
          <input class="compose__field-input" name="to" type="text" value="alexandre.vigneau@epitech.eu" readonly tabindex="-1" />
        </div>
        <div class="compose__field-row">
          <label class="compose__field-label">${t('compose.from')}</label>
          <input class="compose__field-input" name="from" type="text" placeholder="${t('compose.placeholder.name')}" value="${escapeAttr(prefillTo)}" />
        </div>
        <div class="compose__field-row">
          <label class="compose__field-label">${t('compose.email')}</label>
          <input class="compose__field-input" name="email" type="email" placeholder="${t('compose.placeholder.email')}" value="${escapeAttr(prefillEmail)}" />
        </div>
        <div class="compose__field-row">
          <label class="compose__field-label">${t('compose.subject')}</label>
          <input class="compose__field-input" name="subject" type="text" placeholder="${t('compose.placeholder.subject')}" />
        </div>
      </div>

      <div class="compose__honeypot" aria-hidden="true">
        <input name="website" type="text" tabindex="-1" autocomplete="off" />
      </div>

      <textarea class="compose__body" name="message" placeholder="${t('compose.placeholder.message')}"></textarea>

      <div class="compose__status">
        <span class="compose__status-text"></span>
      </div>
    `;

    const fromInput = root.querySelector<HTMLInputElement>('input[name="from"]')!;
    const emailInput = root.querySelector<HTMLInputElement>('input[name="email"]')!;
    const subjectInput = root.querySelector<HTMLInputElement>('input[name="subject"]')!;
    const honeypot = root.querySelector<HTMLInputElement>('input[name="website"]')!;
    const messageArea = root.querySelector<HTMLTextAreaElement>('textarea[name="message"]')!;
    const statusText = root.querySelector<HTMLElement>('.compose__status-text')!;

    let sending = false;

    function setStatus(text: string, isError = false): void {
      statusText.textContent = text;
      statusText.style.color = isError ? '#c00' : '#333';
    }

    function validate(): string | null {
      if (!fromInput.value.trim()) return t('compose.validation.name');
      if (!emailInput.value.trim()) return t('compose.validation.email');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()))
        return t('compose.validation.emailInvalid');
      if (!subjectInput.value.trim()) return t('compose.validation.subject');
      if (!messageArea.value.trim()) return t('compose.validation.message');
      if (fromInput.value.length > 80) return t('compose.validation.nameTooLong');
      if (subjectInput.value.length > 120) return t('compose.validation.subjectTooLong');
      if (messageArea.value.length > 4000) return t('compose.validation.messageTooLong');
      return null;
    }

    async function send(): Promise<void> {
      if (sending) return;

      const error = validate();
      if (error) {
        setStatus(error, true);
        return;
      }

      // Honeypot check (client-side — server also validates)
      if (honeypot.value) {
        setStatus(t('compose.status.sent'));
        return;
      }

      sending = true;
      setStatus(t('compose.status.sending'));
      setFieldsDisabled(true);

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fromInput.value.trim(),
            email: emailInput.value.trim(),
            subject: subjectInput.value.trim(),
            message: messageArea.value.trim(),
            website: honeypot.value,
          }),
        });

        const data = await res.json();

        if (res.ok && data.ok) {
          setStatus(t('compose.status.sent'));
          setTimeout(() => host.close(), 1200);
        } else {
          setStatus(data.error ?? t('compose.status.error'), true);
          setFieldsDisabled(false);
          sending = false;
        }
      } catch {
        setStatus(t('compose.status.networkError'), true);
        setFieldsDisabled(false);
        sending = false;
      }
    }

    function setFieldsDisabled(disabled: boolean): void {
      fromInput.disabled = disabled;
      emailInput.disabled = disabled;
      subjectInput.disabled = disabled;
      messageArea.disabled = disabled;
      const sendBtn = root.querySelector<HTMLButtonElement>('[data-action="send"]')!;
      sendBtn.disabled = disabled;
    }

    // ── Event listeners ───────────────────────────────────────────────────
    root.addEventListener(
      'click',
      (e) => {
        const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
        if (!btn) return;
        if (btn.dataset.action === 'send') void send();
      },
      { signal },
    );

    // Set title
    host.setTitle('New Message');
    host.setIcon('/icons/outlook/create-mail.png');
  },
};

function escapeAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default mod;
