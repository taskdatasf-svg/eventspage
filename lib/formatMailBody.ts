/**
 * Format raw message body into structured HTML with spaced paragraphs and blue clickable links.
 * Client-safe helper (no Node.js server dependencies).
 */
export function formatBroadcastBodyHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  let html = rawHtml.trim();

  // 1. Convert plain line breaks into spaced paragraphs if no HTML block tags exist
  if (!/<(p|div|h1|h2|h3|ul|ol|table)[ >]/i.test(html)) {
    const paragraphs = html.split(/\n\s*\n/);
    html = paragraphs
      .map((p) => `<p style="margin:0 0 16px 0;line-height:1.7;color:#f4f4f5;">${p.replace(/\n/g, '<br />')}</p>`)
      .join('');
  } else {
    // Add default margin-bottom to existing <p> tags
    html = html.replace(/<p>/gi, '<p style="margin:0 0 16px 0;line-height:1.7;color:#f4f4f5;">');
  }

  // 2. Parse Markdown bold (**text**) and italic (*text*) tags
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:700;color:#ffffff;">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em style="font-style:italic;">$1</em>');

  // 3. Auto-detect raw plain URLs (http:// or https://) not inside <a> tags and wrap them in blue clickable links
  const urlRegex = /(?<!href="|href='|">)(https?:\/\/[^\s<"']+)/gi;
  html = html.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#3b82f6 !important;text-decoration:underline !important;font-weight:500;word-break:break-all;">${url}</a>`;
  });

  // 4. Ensure all <a> tags have explicit inline blue color styling for email clients
  html = html.replace(/<a /gi, '<a target="_blank" rel="noopener noreferrer" style="color:#3b82f6 !important;text-decoration:underline !important;font-weight:500;word-break:break-all;" ');

  return html;
}
