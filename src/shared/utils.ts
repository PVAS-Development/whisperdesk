export function sanitizePath(filePath: string): string {
  if (!filePath) return '';

  const parts = filePath.split(/[/\\]/);
  return parts.pop() || '';
}
