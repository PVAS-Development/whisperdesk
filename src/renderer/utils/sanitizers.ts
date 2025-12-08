import DOMPurify from 'dompurify';

export function convertHtmlToText(html: string): string {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'a',
      'strong',
      'em',
      'code',
    ],
    ALLOWED_ATTR: ['href'],
  });

  // After sanitizing HTML for security (preventing XSS), convert it to formatted text for safe display in release notes.
  // This ensures that any potentially dangerous HTML is neutralized, and the output is readable as plain text or markdown-like formatting.
  return clean
    .replace(/<h[1-6]>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<p>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<\/?ul>/gi, '\n')
    .replace(/<\/?ol>/gi, '\n')
    .replace(/<\/?strong>/gi, '**')
    .replace(/<\/?em>/gi, '_')
    .replace(/<\/?code>/gi, '`')
    .replace(/<a href="([^"]+)">([^<]+)<\/a>/gi, '$2 ($1)')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
