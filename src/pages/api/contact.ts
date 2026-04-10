import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

const rateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const POST: APIRoute = async ({ request }) => {
  const ip =
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';

  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: 'Invalid request body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { name, email, subject, message, website } = body as Record<string, string>;

  // Honeypot
  if (website) {
    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Validation
  if (!name || typeof name !== 'string' || !name.trim()) {
    return jsonError('Name is required.', 400);
  }
  if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
    return jsonError('A valid email is required.', 400);
  }
  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    return jsonError('Subject is required.', 400);
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    return jsonError('Message is required.', 400);
  }
  if (name.length > 80) return jsonError('Name is too long.', 400);
  if (subject.length > 120) return jsonError('Subject is too long.', 400);
  if (message.length > 4000) return jsonError('Message is too long.', 400);

  // Send via Resend
  const apiKey = (env as Record<string, any>).RESEND_API_KEY;
  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY is not configured');
    return jsonError('Email service is not configured.', 500);
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Portfolio Contact <noreply@avigneau.dev>',
        to: ['alexandre.vigneau.974@gmail.com'],
        reply_to: email.trim(),
        subject: `[Portfolio] ${subject.trim()}`,
        text: `From: ${name.trim()} <${email.trim()}>\n\n${message.trim()}`,
        html: `<p><strong>From:</strong> ${escapeHtml(name.trim())} &lt;${escapeHtml(email.trim())}&gt;</p><hr/><p>${escapeHtml(message.trim()).replace(/\n/g, '<br/>')}</p>`,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[contact] Resend error:', res.status, errBody);
      return jsonError('Failed to send email. Please try again.', 500);
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[contact] fetch error:', err);
    return jsonError('Failed to send email. Please try again.', 500);
  }
};

function jsonError(error: string, status: number): Response {
  return new Response(
    JSON.stringify({ ok: false, error }),
    { status, headers: { 'Content-Type': 'application/json' } },
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
