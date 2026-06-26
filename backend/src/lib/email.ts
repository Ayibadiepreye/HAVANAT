// Real email sender via Resend.
// Docs: https://resend.com/docs/api-reference/emails/send-email
//
// All transactional emails go through this module so we have a single audit point.
// All templates match the Havanat website design — black/white, Inter + Playfair Display,
// uppercase tracked labels, generous whitespace. No accent color, no gradients.

const RESEND_BASE = 'https://api.resend.com';

export function isEmailConfigured(): boolean {
  const key = process.env.RESEND_API_KEY ?? '';
  return key.startsWith('re_');
}

function getFromAddress(): string {
  // Use Resend's testing domain if havanat.store isn't verified yet.
  // (Once you verify the domain in Resend dashboard, this still works.)
  return process.env.EMAIL_FROM ?? 'Havanat <concierge@havanat.store>';
}

function getReplyTo(): string | undefined {
  return process.env.EMAIL_REPLY_TO ?? 'concierge@havanat.store';
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  from?: string;
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  id: string;
  simulated: boolean;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    // eslint-disable-next-line no-console
    console.info(`[mock-email] To: ${Array.isArray(input.to) ? input.to.join(',') : input.to} — Subject: ${input.subject}`);
    return { id: `mock-${Date.now()}`, simulated: true };
  }
  const apiKey = process.env.RESEND_API_KEY ?? '';
  const body = {
    from: input.from ?? getFromAddress(),
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
    html: input.html,
    text: input.text ?? stripHtml(input.html),
    reply_to: input.replyTo ?? getReplyTo(),
    tags: input.tags,
  };
  const res = await fetch(`${RESEND_BASE}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) {
    const msg = (data && data.message) || `Resend ${res.status}`;
    throw new Error(msg);
  }
  return { id: data.id ?? '', simulated: false };
}

/** Send an email and swallow errors (logs to console). Used for non-critical notifications. */
export async function sendEmailSafe(input: SendEmailInput): Promise<{ ok: boolean; error?: string }> {
  try {
    await sendEmail(input);
    return { ok: true };
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[email-failed]', input.subject, '→', input.to, ':', err?.message ?? err);
    // Also log response body if available (Resend returns useful error info)
    if (err?.response) {
      try {
        const body = await err.response.text();
        console.error('[email-failed-body]', body);
      } catch {}
    }
    return { ok: false, error: err?.message ?? 'send failed' };
  }
}


function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// ─── Brand tokens (match the website) ─────────────────────────────
const FONT_SANS = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const FONT_SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const BLACK = '#000000';
const WHITE = '#ffffff';
const INK = '#111111';
const MUTED = '#6b6b6b';
const LINE = '#e5e5e5';
const SOFT = '#fafafa';
const SOFT_LINE = '#ececec';

// ─── Email shell ──────────────────────────────────────────────────
// Matches the website: black header bar, white card on near-white bg,
// uppercase tracked wordmark, Playfair Display title, Inter body,
// black footer bar, generous whitespace, hairline borders.
export function emailShell(opts: {
  eyebrow?: string;          // tiny uppercase label above title (e.g. "ORDER CONFIRMATION")
  title: string;             // main heading (serif)
  preheader?: string;        // invisible preview text
  bodyHtml: string;          // the main content
  footerNote?: string;       // optional small line above the footer
}): string {
  const { eyebrow, title, preheader, bodyHtml, footerNote } = opts;
  const preheaderHtml = preheader
    ? `<div style="display:none;font-size:1px;color:#fafafa;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)} · Havanat</title>
  ${preheaderHtml}
</head>
<body style="margin:0;padding:0;background:${SOFT};font-family:${FONT_SANS};color:${INK};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${SOFT};">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <!-- Brand header (matches Navbar: black, centered wordmark, tracked) -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 28px 0;">
              <div style="font-family:${FONT_SERIF};font-size:28px;letter-spacing:0.4em;color:${BLACK};font-weight:400;">HAVANAT</div>
              <div style="font-family:${FONT_SANS};font-size:9px;letter-spacing:0.32em;color:${MUTED};text-transform:uppercase;margin-top:6px;">Where Style Meets Elegance</div>
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background:${WHITE};border:1px solid ${LINE};">
          ${eyebrow ? `
          <tr>
            <td style="padding:32px 48px 0 48px;">
              <div style="font-family:${FONT_SANS};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${MUTED};font-weight:600;">${escapeHtml(eyebrow)}</div>
            </td>
          </tr>` : ''}
          <tr>
            <td style="${eyebrow ? 'padding:8px 48px 0 48px;' : 'padding:48px 48px 0 48px;'}">
              <h1 style="margin:0;font-family:${FONT_SERIF};font-size:28px;line-height:1.25;font-weight:500;color:${BLACK};letter-spacing:-0.01em;">${escapeHtml(title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 48px 40px 48px;font-family:${FONT_SANS};font-size:14px;line-height:1.7;color:${INK};">
              ${bodyHtml}
            </td>
          </tr>
        </table>

        ${footerNote ? `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;">
          <tr>
            <td align="center" style="padding:24px 24px 0 24px;font-family:${FONT_SANS};font-size:11px;color:${MUTED};line-height:1.6;">
              ${footerNote}
            </td>
          </tr>
        </table>` : ''}

        <!-- Footer bar (black, matches website Footer.tsx) -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background:${BLACK};margin-top:28px;">
          <tr>
            <td style="padding:28px 32px;text-align:center;">
              <div style="font-family:${FONT_SERIF};font-size:13px;letter-spacing:0.35em;color:${WHITE};">HAVANAT</div>
              <div style="margin-top:14px;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.55);line-height:1.9;">
                <a href="https://havanat.store" style="color:rgba(255,255,255,0.7);text-decoration:none;">Website</a>
                &nbsp;·&nbsp;
                <a href="https://havanat.store/shop" style="color:rgba(255,255,255,0.7);text-decoration:none;">Shop</a>
                &nbsp;·&nbsp;
                <a href="https://havanat.store/contact" style="color:rgba(255,255,255,0.7);text-decoration:none;">Concierge</a>
              </div>
              <div style="margin-top:18px;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.15em;color:rgba(255,255,255,0.4);line-height:1.7;">
                Port Harcourt, Rivers State, Nigeria<br>
                concierge@havanat.store · +234 803 000 0000
              </div>
              <div style="margin-top:14px;font-family:${FONT_SANS};font-size:9px;letter-spacing:0.1em;color:rgba(255,255,255,0.3);">
                © ${new Date().getFullYear()} Havanat. All rights reserved.
              </div>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Reusable building blocks (match the website's typographic system)
function btn(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:32px auto;">
  <tr>
    <td align="center" style="background:${BLACK};">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:15px 36px;background:${BLACK};color:${WHITE};text-decoration:none;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;font-weight:600;">${escapeHtml(label)}</a>
    </td>
  </tr>
</table>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid ${LINE};margin:32px 0;">`;
}

function labelValue(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid ${SOFT_LINE};font-family:${FONT_SANS};font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:${MUTED};font-weight:600;width:130px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid ${SOFT_LINE};font-family:${FONT_SANS};font-size:14px;color:${INK};vertical-align:top;">${value}</td>
  </tr>`;
}

function muted(text: string): string {
  return `<p style="margin:16px 0 0 0;font-family:${FONT_SANS};font-size:12px;color:${MUTED};line-height:1.6;">${text}</p>`;
}

// ─── Templates ────────────────────────────────────────────────────

export function orderConfirmationEmail(order: {
  reference: string;
  total: string | number;
  items: { name: string; quantity: number; price: string | number }[];
  deliveryAddress?: { fullName: string; phone: string; street: string; city: string; state: string };
  customerName?: string;
}): string {
  const itemsRows = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${SOFT_LINE};font-family:${FONT_SANS};font-size:14px;color:${INK};">${escapeHtml(i.name)}</td>
        <td style="padding:14px 0;border-bottom:1px solid ${SOFT_LINE};font-family:${FONT_SANS};font-size:13px;color:${MUTED};text-align:center;width:60px;">× ${i.quantity}</td>
        <td style="padding:14px 0;border-bottom:1px solid ${SOFT_LINE};font-family:${FONT_SANS};font-size:14px;color:${INK};text-align:right;width:120px;">₦${(Number(i.price) * Number(i.quantity)).toLocaleString()}</td>
      </tr>`
    )
    .join('');
  const greeting = order.customerName ? `Dear ${escapeHtml(order.customerName.split(' ')[0])},` : 'Thank you for your order.';
  const addr = order.deliveryAddress
    ? `<p style="margin:16px 0 4px 0;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:${MUTED};font-weight:600;">Delivering to</p>
       <p style="margin:0;font-family:${FONT_SANS};font-size:14px;line-height:1.6;color:${INK};">
         ${escapeHtml(order.deliveryAddress.fullName)}<br>
         ${escapeHtml(order.deliveryAddress.street)}<br>
         ${escapeHtml(order.deliveryAddress.city)}, ${escapeHtml(order.deliveryAddress.state)}<br>
         ${escapeHtml(order.deliveryAddress.phone)}
       </p>`
    : '';
  return emailShell({
    eyebrow: 'Order Confirmation',
    title: `Your order ${order.reference} is confirmed`,
    preheader: `Order ${order.reference} confirmed — we'll send updates as it progresses.`,
    bodyHtml: `
      <p style="margin:0 0 16px 0;font-family:${FONT_SANS};font-size:15px;line-height:1.7;color:${INK};">${greeting}</p>
      <p style="margin:0 0 24px 0;font-family:${FONT_SANS};font-size:15px;line-height:1.7;color:${INK};">Thank you for choosing Havanat. Your bespoke experience begins here. Below is a summary of your order.</p>
      ${divider()}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 8px 0;">
        ${itemsRows}
        <tr>
          <td colspan="2" style="padding:18px 0 4px 0;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${MUTED};font-weight:600;">Total</td>
          <td style="padding:18px 0 4px 0;font-family:${FONT_SERIF};font-size:22px;color:${BLACK};text-align:right;">₦${Number(order.total).toLocaleString()}</td>
        </tr>
      </table>
      ${addr}
      ${muted('You\'ll receive a tracking link once your order ships. Reply to this email if you have any questions — our concierge is here.')}
    `,
  });
}

export function twoFactorCodeEmail(code: string): string {
  return emailShell({
    eyebrow: 'Verification',
    title: 'Your verification code',
    preheader: `Your Havanat verification code: ${code}`,
    bodyHtml: `
      <p style="margin:0 0 8px 0;font-family:${FONT_SANS};font-size:15px;line-height:1.7;color:${INK};">Enter the code below to continue. It expires in 10 minutes and can only be used once.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:32px 0;">
        <tr>
          <td align="center" style="padding:36px 24px;background:${SOFT};border:1px solid ${LINE};">
            <div style="font-family:'SF Mono','Menlo','Consolas',monospace;font-size:40px;letter-spacing:0.6em;font-weight:300;color:${BLACK};text-align:center;">${escapeHtml(code)}</div>
            <div style="margin-top:16px;font-family:${FONT_SANS};font-size:9px;letter-spacing:0.3em;text-transform:uppercase;color:${MUTED};font-weight:600;">Six-digit code</div>
          </td>
        </tr>
      </table>
      ${muted('If you didn\'t request this code, you can safely ignore this email. Your account remains secure.')}
    `,
  });
}

export function passwordResetEmail(resetLink: string): string {
  return emailShell({
    eyebrow: 'Account Security',
    title: 'Reset your password',
    preheader: 'Reset your Havanat password — link expires in 1 hour.',
    bodyHtml: `
      <p style="margin:0 0 8px 0;font-family:${FONT_SANS};font-size:15px;line-height:1.7;color:${INK};">We received a request to reset your Havanat password. Click the button below to choose a new one.</p>
      <p style="margin:0 0 0 0;font-family:${FONT_SANS};font-size:14px;line-height:1.7;color:${MUTED};">This link expires in 1 hour and can only be used once.</p>
      ${btn('Reset password', resetLink)}
      ${divider()}
      <p style="margin:0;font-family:${FONT_SANS};font-size:12px;line-height:1.6;color:${MUTED};">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="margin:8px 0 0 0;font-family:'SF Mono','Menlo','Consolas',monospace;font-size:11px;line-height:1.5;color:${INK};word-break:break-all;">${escapeHtml(resetLink)}</p>
      ${muted('If you didn\'t request a password reset, ignore this email — your password will not change.')}
    `,
  });
}

export function emailVerificationEmail(verifyLink: string, customerName?: string): string {
  const greeting = customerName ? `Welcome, ${escapeHtml(customerName.split(' ')[0])}.` : 'Welcome to Havanat.';
  return emailShell({
    eyebrow: 'Welcome',
    title: 'Confirm your email',
    preheader: 'Confirm your email to finish setting up your Havanat account.',
    bodyHtml: `
      <p style="margin:0 0 8px 0;font-family:${FONT_SANS};font-size:15px;line-height:1.7;color:${INK};">${greeting}</p>
      <p style="margin:0 0 24px 0;font-family:${FONT_SANS};font-size:15px;line-height:1.7;color:${INK};">Confirm your email address to unlock orders, returns, and member-only fittings.</p>
      ${btn('Confirm email', verifyLink)}
      ${divider()}
      <p style="margin:0;font-family:${FONT_SANS};font-size:12px;line-height:1.6;color:${MUTED};">Or paste this link into your browser:</p>
      <p style="margin:8px 0 0 0;font-family:'SF Mono','Menlo','Consolas',monospace;font-size:11px;line-height:1.5;color:${INK};word-break:break-all;">${escapeHtml(verifyLink)}</p>
      ${muted('This link expires in 24 hours. If you didn\'t create a Havanat account, ignore this email.')}
    `,
  });
}

export function bespokeRequestEmailToAdmin(req: {
  id: string | number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  occasion: string;
  budget?: number | string;
  timeline?: string;
  description: string;
  adminLink: string;
}): string {
  const budget = req.budget !== undefined && req.budget !== null && req.budget !== ''
    ? `₦${Number(req.budget).toLocaleString()}`
    : '—';
  return emailShell({
    eyebrow: 'Bespoke Request',
    title: `New bespoke request — ${req.occasion}`,
    preheader: `Bespoke request from ${req.customerName} for ${req.occasion}`,
    bodyHtml: `
      <p style="margin:0 0 20px 0;font-family:${FONT_SANS};font-size:15px;line-height:1.7;color:${INK};">
        <strong style="font-family:${FONT_SERIF};font-weight:500;">${escapeHtml(req.customerName)}</strong>
        submitted a bespoke request.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${labelValue('Customer', `${escapeHtml(req.customerName)}<br><a href="mailto:${escapeHtml(req.customerEmail)}" style="color:${INK};text-decoration:none;">${escapeHtml(req.customerEmail)}</a>${req.customerPhone ? `<br>${escapeHtml(req.customerPhone)}` : ''}`)}
        ${labelValue('Occasion', escapeHtml(req.occasion))}
        ${labelValue('Budget', escapeHtml(budget))}
        ${labelValue('Timeline', req.timeline ? escapeHtml(req.timeline) : '—')}
      </table>
      <p style="margin:24px 0 8px 0;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:${MUTED};font-weight:600;">Notes</p>
      <div style="margin:0;padding:20px 24px;background:${SOFT};border-left:2px solid ${BLACK};font-family:${FONT_SANS};font-size:14px;line-height:1.7;color:${INK};white-space:pre-wrap;">${escapeHtml(req.description)}</div>
      ${btn('View in admin', req.adminLink)}
      ${muted(`Reply directly to this email to respond to ${req.customerName} — your reply will go to ${req.customerEmail}.`)}
    `,
  });
}

export function bespokeRequestConfirmationToCustomer(req: {
  reference: string;
  customerName?: string;
  occasion: string;
  trackingLink: string;
}): string {
  const greeting = req.customerName ? `Dear ${escapeHtml(req.customerName.split(' ')[0])},` : 'Thank you for your interest.';
  return emailShell({
    eyebrow: 'Bespoke Request Received',
    title: `We've received your request — ${req.reference}`,
    preheader: `Bespoke request ${req.reference} received. Our concierge will be in touch within 24 hours.`,
    bodyHtml: `
      <p style="margin:0 0 16px 0;font-family:${FONT_SANS};font-size:15px;line-height:1.7;color:${INK};">${greeting}</p>
      <p style="margin:0 0 24px 0;font-family:${FONT_SANS};font-size:15px;line-height:1.7;color:${INK};">Thank you for considering a bespoke piece. Our concierge reviews each request within 24 hours and will reach out with questions or a quote.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${labelValue('Reference', escapeHtml(req.reference))}
        ${labelValue('Occasion', escapeHtml(req.occasion))}
        ${labelValue('Response', 'Within 24 hours')}
      </table>
      ${btn('View your request', req.trackingLink)}
      ${muted('You can reply directly to this email to add more specs, measurements, or reference images.')}
    `,
  });
}

export function contactFormEmailToAdmin(message: {
  name: string;
  email: string;
  subject: string;
  body: string;
}): string {
  return emailShell({
    eyebrow: 'Contact Form',
    title: `New message — ${message.subject}`,
    preheader: `Message from ${message.name}: ${message.subject}`,
    bodyHtml: `
      <p style="margin:0 0 20px 0;font-family:${FONT_SANS};font-size:15px;line-height:1.7;color:${INK};">
        <strong style="font-family:${FONT_SERIF};font-weight:500;">${escapeHtml(message.name)}</strong>
        sent a message via the contact form.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${labelValue('From', `<a href="mailto:${escapeHtml(message.email)}" style="color:${INK};text-decoration:none;">${escapeHtml(message.email)}</a>`)}
        ${labelValue('Subject', escapeHtml(message.subject))}
      </table>
      <p style="margin:24px 0 8px 0;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:${MUTED};font-weight:600;">Message</p>
      <div style="margin:0;padding:20px 24px;background:${SOFT};border-left:2px solid ${BLACK};font-family:${FONT_SANS};font-size:14px;line-height:1.7;color:${INK};white-space:pre-wrap;">${escapeHtml(message.body)}</div>
      ${muted(`Reply directly to this email to respond to ${message.name} — your reply will go to ${message.email}.`)}
    `,
  });
}

export function orderStatusEmail(order: {
  reference: string;
  status: string;
  trackingUrl?: string;
}): string {
  const tracking = order.trackingUrl ? btn('Track order', order.trackingUrl) : '';
  return emailShell({
    eyebrow: 'Order Update',
    title: `Order ${order.reference}`,
    preheader: `Order ${order.reference} is now ${order.status}.`,
    bodyHtml: `
      <p style="margin:0 0 16px 0;font-family:${FONT_SANS};font-size:15px;line-height:1.7;color:${INK};">Your order status has been updated.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 24px 0;">
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid ${SOFT_LINE};font-family:${FONT_SANS};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${MUTED};font-weight:600;width:140px;">Reference</td>
          <td style="padding:14px 0;border-bottom:1px solid ${SOFT_LINE};font-family:${FONT_SERIF};font-size:18px;color:${BLACK};">${escapeHtml(order.reference)}</td>
        </tr>
        <tr>
          <td style="padding:14px 0;font-family:${FONT_SANS};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${MUTED};font-weight:600;">Status</td>
          <td style="padding:14px 0;font-family:${FONT_SERIF};font-size:18px;color:${BLACK};text-transform:capitalize;">${escapeHtml(order.status)}</td>
        </tr>
      </table>
      ${tracking}
      ${muted('Questions? Reply to this email and our concierge will help.')}
    `,
  });
}

export function welcomeEmail(customerName: string): string {
  return emailShell({
    eyebrow: 'Welcome',
    title: 'Welcome to Havanat',
    preheader: 'Welcome to Havanat — Where Style Meets Elegance.',
    bodyHtml: `
      <p style="margin:0 0 16px 0;font-family:${FONT_SANS};font-size:15px;line-height:1.7;color:${INK};">Dear ${escapeHtml(customerName.split(' ')[0])},</p>
      <p style="margin:0 0 24px 0;font-family:${FONT_SERIF};font-style:italic;font-size:17px;line-height:1.6;color:${INK};">"Where Style Meets Elegance."</p>
      <p style="margin:0 0 16px 0;font-family:${FONT_SANS};font-size:15px;line-height:1.7;color:${INK};">Thank you for joining us. Havanat exists for the modern Nigerian professional — premium, well-cut, well-priced. Browse the collection, request a bespoke piece, or visit our studio in Port Harcourt.</p>
      ${btn('Shop the collection', 'https://havanat.store/shop')}
      ${muted('You\'ll hear from us only when there\'s something worth saying. — The Havanat Concierge')}
    `,
  });
}