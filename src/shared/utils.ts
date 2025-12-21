export function sanitizePath(filePath: string | null | undefined): string {
  if (!filePath) return '';

  const parts = filePath.split(/[/\\]/);
  return parts.pop() || '';
}
