import { Router } from 'express';
import { z } from 'zod';
import { sendEmailSafe } from '../lib/email.js';
import { config } from '../config.js';

export const contactRouter = Router();

const ContactSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  subject: z.string().min(1, 'Subject required'),
  message: z.string().min(1, 'Message required'),
  images: z.array(z.string().url()).optional(),
});

// POST /api/contact - public contact form submission
contactRouter.post('/', async (req, res) => {
  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
  }

  const { name, email, subject, message, images } = parsed.data;

  // Build email HTML
  const imageSection = images && images.length > 0
    ? `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
        <p style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px;">Attachments</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;">
          ${images.map(url => `<img src="${url}" alt="Attachment" style="width: 100%; height: 150px; object-fit: cover; border: 1px solid #e5e5e5;" />`).join('')}
        </div>
      </div>
    `
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
        .field { margin-bottom: 15px; }
        .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-bottom: 5px; }
        .value { font-size: 14px; color: #000; }
        .message-box { background: #f8f8f8; padding: 15px; border-left: 3px solid #000; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="font-family: Georgia, serif; font-size: 24px; font-weight: 300; margin: 0;">New Contact Form Submission</h1>
        </div>
        
        <div class="field">
          <div class="label">From</div>
          <div class="value">${name} &lt;${email}&gt;</div>
        </div>
        
        <div class="field">
          <div class="label">Subject</div>
          <div class="value">${subject}</div>
        </div>
        
        <div class="field">
          <div class="label">Message</div>
          <div class="message-box">${message.replace(/\n/g, '<br>')}</div>
        </div>
        
        ${imageSection}
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #999;">
          <p>This message was sent via the HAVANAT contact form.</p>
          <p>Reply directly to this email to respond to ${name}.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send to admin
  const result = await sendEmailSafe({
    to: config.emailFrom.replace(/^.*<(.+)>$/, '$1'), // Extract email from "Name <email>" format
    replyTo: email,
    subject: `Contact Form: ${subject}`,
    html,
  });

  if (!result.ok) {
    console.error('Failed to send contact email:', result.error);
    return res.status(500).json({ error: 'Failed to send message' });
  }

  res.json({ ok: true, message: 'Message sent successfully' });
});
