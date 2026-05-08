import { randomUUID } from 'crypto';
import { protocol } from 'electron';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export const MEDIA_PROTOCOL = 'whisperdesk-media';

const MEDIA_SOURCE_TTL_MS = 30 * 60 * 1000;
const MAX_MEDIA_SOURCES = 100;
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
};

interface MediaSourceEntry {
  filePath: string;
  expiresAt: number;
}

const mediaSources = new Map<string, MediaSourceEntry>();
let protocolHandlerRegistered = false;

interface ByteRange {
  start: number;
  end: number;
}

function getMediaSourceExpiration(now = Date.now()): number {
  return now + MEDIA_SOURCE_TTL_MS;
}

function purgeExpiredMediaSources(now = Date.now()): void {
  for (const [token, entry] of mediaSources) {
    if (entry.expiresAt > now) {
      continue;
    }

    mediaSources.delete(token);
  }
}

function evictLeastRecentlyUsedMediaSources(): void {
  while (mediaSources.size >= MAX_MEDIA_SOURCES) {
    const oldestToken = mediaSources.keys().next().value;

    if (!oldestToken) {
      break;
    }

    mediaSources.delete(oldestToken);
  }
}

function getMediaSourceEntry(token: string): MediaSourceEntry | null {
  const entry = mediaSources.get(token);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    mediaSources.delete(token);
    return null;
  }

  const refreshedEntry: MediaSourceEntry = {
    filePath: entry.filePath,
    expiresAt: getMediaSourceExpiration(),
  };
  mediaSources.delete(token);
  mediaSources.set(token, refreshedEntry);
  return refreshedEntry;
}

function createMediaErrorResponse(error: unknown): Response {
  const errorCode =
    typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : null;

  if (
    errorCode === 'ENOENT' ||
    errorCode === 'ENOTDIR' ||
    errorCode === 'EACCES' ||
    errorCode === 'EPERM'
  ) {
    return new Response('Media source not found', {
      status: 404,
      headers: NO_STORE_HEADERS,
    });
  }

  return new Response('Unable to load media source', {
    status: 500,
    headers: NO_STORE_HEADERS,
  });
}

function getContentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.flac': 'audio/flac',
    '.ogg': 'audio/ogg',
    '.opus': 'audio/ogg',
    '.oga': 'audio/ogg',
    '.amr': 'audio/amr',
    '.wma': 'audio/x-ms-wma',
    '.aac': 'audio/aac',
    '.aiff': 'audio/aiff',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.m4v': 'video/x-m4v',
  };

  return contentTypes[extension] ?? 'application/octet-stream';
}

function parseRangeHeader(rangeHeader: string | null, fileSize: number): ByteRange | null {
  if (!rangeHeader) {
    return null;
  }

  const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) {
    return null;
  }

  const startValue = match[1] ?? '';
  const endValue = match[2] ?? '';

  if (!startValue && !endValue) {
    return null;
  }

  if (!startValue) {
    const suffixLength = Number(endValue);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
      return null;
    }

    return {
      start: Math.max(0, fileSize - suffixLength),
      end: fileSize - 1,
    };
  }

  const start = Number(startValue);
  const end = endValue ? Number(endValue) : fileSize - 1;

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end < start ||
    start >= fileSize
  ) {
    return null;
  }

  return {
    start,
    end: Math.min(end, fileSize - 1),
  };
}

async function createMediaResponse(request: Request, filePath: string): Promise<Response> {
  const stats = await fs.promises.stat(filePath);
  const fileSize = stats.size;
  const contentType = getContentType(filePath);
  const range = parseRangeHeader(request.headers.get('range'), fileSize);

  if (request.headers.has('range') && !range) {
    return new Response(null, {
      status: 416,
      headers: {
        'Accept-Ranges': 'bytes',
        ...NO_STORE_HEADERS,
        'Content-Range': `bytes */${fileSize}`,
      },
    });
  }

  const start = range?.start ?? 0;
  const end = range?.end ?? Math.max(0, fileSize - 1);
  const contentLength = fileSize === 0 ? 0 : end - start + 1;
  const stream =
    request.method === 'HEAD'
      ? null
      : (Readable.toWeb(fs.createReadStream(filePath, { start, end })) as ReadableStream);

  return new Response(stream, {
    status: range ? 206 : 200,
    headers: {
      'Accept-Ranges': 'bytes',
      ...NO_STORE_HEADERS,
      'Content-Length': String(contentLength),
      'Content-Type': contentType,
      ...(range ? { 'Content-Range': `bytes ${start}-${end}/${fileSize}` } : {}),
    },
  });
}

export function registerMediaProtocolScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: MEDIA_PROTOCOL,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
      },
    },
  ]);
}

export function registerMediaProtocolHandler(): void {
  if (protocolHandlerRegistered) {
    return;
  }

  protocol.handle(MEDIA_PROTOCOL, async (request) => {
    const url = new URL(request.url);
    const token = url.hostname || url.pathname.replace(/^\//, '');
    const entry = getMediaSourceEntry(token);

    if (!entry) {
      return new Response('Media source not found', {
        status: 404,
        headers: NO_STORE_HEADERS,
      });
    }

    try {
      return await createMediaResponse(request, entry.filePath);
    } catch (error) {
      mediaSources.delete(token);
      return createMediaErrorResponse(error);
    }
  });

  protocolHandlerRegistered = true;
}

export function createMediaProtocolUrl(filePath: string): string {
  purgeExpiredMediaSources();
  evictLeastRecentlyUsedMediaSources();

  const resolvedPath = path.resolve(filePath);
  const token = randomUUID();
  mediaSources.set(token, {
    filePath: resolvedPath,
    expiresAt: getMediaSourceExpiration(),
  });
  return `${MEDIA_PROTOCOL}://${token}`;
}
