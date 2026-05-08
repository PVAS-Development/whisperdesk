import type * as fs from 'fs';
import { Readable } from 'stream';
import type { ReadableStream as NodeReadableStream } from 'stream/web';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createReadStreamMock, handleMock, registerSchemesAsPrivilegedMock, statMock } = vi.hoisted(
  () => ({
    createReadStreamMock: vi.fn(),
    handleMock: vi.fn(),
    registerSchemesAsPrivilegedMock: vi.fn(),
    statMock: vi.fn(),
  })
);

vi.mock('electron', () => ({
  protocol: {
    handle: handleMock,
    registerSchemesAsPrivileged: registerSchemesAsPrivilegedMock,
  },
}));

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof fs>('fs');

  return {
    ...actual,
    default: {
      ...actual,
      createReadStream: createReadStreamMock,
      promises: {
        ...actual.promises,
        stat: statMock,
      },
    },
    createReadStream: createReadStreamMock,
    promises: {
      ...actual.promises,
      stat: statMock,
    },
  };
});

async function loadMediaProtocolModule() {
  vi.resetModules();
  createReadStreamMock.mockReset();
  handleMock.mockReset();
  registerSchemesAsPrivilegedMock.mockReset();
  statMock.mockReset();

  return import('../media-protocol');
}

function getRegisteredHandler(): (request: Request) => Promise<Response> {
  const handler = handleMock.mock.calls[0]?.[1];

  if (!handler) {
    throw new Error('Media protocol handler was not registered');
  }

  return handler as (request: Request) => Promise<Response>;
}

function createProtocolRequest(
  url: string,
  options?: { method?: 'GET' | 'HEAD'; range?: string }
): Request {
  const headers = new Headers();

  if (options?.range) {
    headers.set('range', options.range);
  }

  return {
    url,
    method: options?.method ?? 'GET',
    headers,
  } as Request;
}

describe('media-protocol', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-07T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('registers the privileged media protocol scheme', async () => {
    const { MEDIA_PROTOCOL, registerMediaProtocolScheme } = await loadMediaProtocolModule();

    registerMediaProtocolScheme();

    expect(registerSchemesAsPrivilegedMock).toHaveBeenCalledWith([
      expect.objectContaining({
        scheme: MEDIA_PROTOCOL,
        privileges: expect.objectContaining({
          secure: true,
          standard: true,
          stream: true,
          supportFetchAPI: true,
        }),
      }),
    ]);
  });

  it('returns 404 and evicts a token when the backing file becomes unavailable', async () => {
    const { createMediaProtocolUrl, registerMediaProtocolHandler } =
      await loadMediaProtocolModule();
    const url = createMediaProtocolUrl('/tmp/audio.mp3');

    statMock.mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' }));
    registerMediaProtocolHandler();

    const handler = getRegisteredHandler();
    const response = await handler(createProtocolRequest(url));

    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Pragma')).toBe('no-cache');
    expect(await response.text()).toBe('Media source not found');

    statMock.mockClear();

    const retryResponse = await handler(createProtocolRequest(url));

    expect(retryResponse.status).toBe(404);
    expect(statMock).not.toHaveBeenCalled();
  });

  it('returns 500 when media loading fails unexpectedly', async () => {
    const { createMediaProtocolUrl, registerMediaProtocolHandler } =
      await loadMediaProtocolModule();
    const url = createMediaProtocolUrl('/tmp/audio.mp3');

    statMock.mockRejectedValue(Object.assign(new Error('io failure'), { code: 'EIO' }));
    registerMediaProtocolHandler();

    const response = await getRegisteredHandler()(createProtocolRequest(url));

    expect(response.status).toBe(500);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Pragma')).toBe('no-cache');
    expect(await response.text()).toBe('Unable to load media source');
  });

  it.each(['ENOTDIR', 'EACCES', 'EPERM'])('returns 404 for %s file access errors', async (code) => {
    const { createMediaProtocolUrl, registerMediaProtocolHandler } =
      await loadMediaProtocolModule();
    const url = createMediaProtocolUrl('/tmp/audio.mp3');

    statMock.mockRejectedValue(Object.assign(new Error('missing'), { code }));
    registerMediaProtocolHandler();

    const response = await getRegisteredHandler()(createProtocolRequest(url));

    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.text()).toBe('Media source not found');
  });

  it('registers the handler once and resolves tokens from the pathname when needed', async () => {
    const { createMediaProtocolUrl, registerMediaProtocolHandler, MEDIA_PROTOCOL } =
      await loadMediaProtocolModule();
    const url = createMediaProtocolUrl('/tmp/audio.bin');
    const token = new URL(url).hostname;
    const pathnameUrl = `${MEDIA_PROTOCOL}:///${token}`;
    const webStream = new ReadableStream() as unknown as NodeReadableStream;

    statMock.mockResolvedValue({ size: 12 });
    createReadStreamMock.mockReturnValue({} as fs.ReadStream);
    vi.spyOn(Readable, 'toWeb').mockReturnValue(webStream);

    registerMediaProtocolHandler();
    registerMediaProtocolHandler();

    expect(handleMock).toHaveBeenCalledTimes(1);

    const response = await getRegisteredHandler()(createProtocolRequest(pathnameUrl));

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('Pragma')).toBe('no-cache');
    expect(response.headers.get('Content-Type')).toBe('application/octet-stream');
    expect(response.headers.get('Content-Length')).toBe('12');
    expect(response.headers.get('Content-Range')).toBeNull();
    expect(createReadStreamMock).toHaveBeenCalledWith('/tmp/audio.bin', { start: 0, end: 11 });
    expect(Readable.toWeb).toHaveBeenCalledOnce();
  });

  it('expires old media tokens before resolving them', async () => {
    const { createMediaProtocolUrl, registerMediaProtocolHandler } =
      await loadMediaProtocolModule();
    const url = createMediaProtocolUrl('/tmp/audio.mp3');

    vi.advanceTimersByTime(31 * 60 * 1000);
    registerMediaProtocolHandler();

    const response = await getRegisteredHandler()(createProtocolRequest(url));

    expect(response.status).toBe(404);
    expect(statMock).not.toHaveBeenCalled();
  });

  it('evicts the least recently used token once the cache reaches capacity', async () => {
    const { createMediaProtocolUrl, registerMediaProtocolHandler } =
      await loadMediaProtocolModule();
    const urls = Array.from({ length: 101 }, (_, index) =>
      createMediaProtocolUrl(`/tmp/audio-${index}.mp3`)
    );
    const oldestUrl = urls[0]!;
    const newestUrl = urls[100]!;

    statMock.mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' }));
    registerMediaProtocolHandler();

    const handler = getRegisteredHandler();
    const oldestResponse = await handler(createProtocolRequest(oldestUrl));

    expect(oldestResponse.status).toBe(404);
    expect(statMock).not.toHaveBeenCalled();

    const newestResponse = await handler(createProtocolRequest(newestUrl));

    expect(newestResponse.status).toBe(404);
    expect(statMock).toHaveBeenCalledTimes(1);
  });

  it('supports valid range requests and head requests', async () => {
    const { createMediaProtocolUrl, registerMediaProtocolHandler } =
      await loadMediaProtocolModule();
    const url = createMediaProtocolUrl('/tmp/audio.mp4');
    const webStream = new ReadableStream() as unknown as NodeReadableStream;

    statMock.mockResolvedValue({ size: 10 });
    createReadStreamMock.mockReturnValue({} as fs.ReadStream);
    vi.spyOn(Readable, 'toWeb').mockReturnValue(webStream);
    registerMediaProtocolHandler();

    const handler = getRegisteredHandler();
    const explicitRangeResponse = await handler(createProtocolRequest(url, { range: 'bytes=2-4' }));

    expect(explicitRangeResponse.status).toBe(206);
    expect(explicitRangeResponse.headers.get('Cache-Control')).toBe('no-store');
    expect(explicitRangeResponse.headers.get('Pragma')).toBe('no-cache');
    expect(explicitRangeResponse.headers.get('Content-Type')).toBe('video/mp4');
    expect(explicitRangeResponse.headers.get('Content-Length')).toBe('3');
    expect(explicitRangeResponse.headers.get('Content-Range')).toBe('bytes 2-4/10');

    const openEndedRangeResponse = await handler(createProtocolRequest(url, { range: 'bytes=5-' }));

    expect(openEndedRangeResponse.status).toBe(206);
    expect(openEndedRangeResponse.headers.get('Content-Length')).toBe('5');
    expect(openEndedRangeResponse.headers.get('Content-Range')).toBe('bytes 5-9/10');

    const suffixRangeResponse = await handler(createProtocolRequest(url, { range: 'bytes=-3' }));

    expect(suffixRangeResponse.status).toBe(206);
    expect(suffixRangeResponse.headers.get('Content-Length')).toBe('3');
    expect(suffixRangeResponse.headers.get('Content-Range')).toBe('bytes 7-9/10');

    statMock.mockResolvedValue({ size: 0 });

    const headResponse = await handler(createProtocolRequest(url, { method: 'HEAD' }));

    expect(headResponse.status).toBe(200);
    expect(headResponse.headers.get('Content-Length')).toBe('0');
    expect(createReadStreamMock).toHaveBeenNthCalledWith(1, '/tmp/audio.mp4', { start: 2, end: 4 });
    expect(createReadStreamMock).toHaveBeenNthCalledWith(2, '/tmp/audio.mp4', { start: 5, end: 9 });
    expect(createReadStreamMock).toHaveBeenNthCalledWith(3, '/tmp/audio.mp4', { start: 7, end: 9 });
    expect(createReadStreamMock).toHaveBeenCalledTimes(3);
  });

  it('returns 416 for invalid range requests', async () => {
    const { createMediaProtocolUrl, registerMediaProtocolHandler } =
      await loadMediaProtocolModule();
    const url = createMediaProtocolUrl('/tmp/audio.mp3');

    statMock.mockResolvedValue({ size: 10 });
    registerMediaProtocolHandler();

    const handler = getRegisteredHandler();
    const missingRangeBoundsResponse = await handler(
      createProtocolRequest(url, { range: 'bytes=-' })
    );

    expect(missingRangeBoundsResponse.status).toBe(416);
    expect(missingRangeBoundsResponse.headers.get('Cache-Control')).toBe('no-store');
    expect(missingRangeBoundsResponse.headers.get('Pragma')).toBe('no-cache');
    expect(missingRangeBoundsResponse.headers.get('Content-Range')).toBe('bytes */10');

    const invalidSuffixRangeResponse = await handler(
      createProtocolRequest(url, { range: 'bytes=-0' })
    );

    expect(invalidSuffixRangeResponse.status).toBe(416);

    const outOfBoundsRangeResponse = await handler(
      createProtocolRequest(url, { range: 'bytes=10-12' })
    );

    expect(outOfBoundsRangeResponse.status).toBe(416);
    expect(createReadStreamMock).not.toHaveBeenCalled();
  });
});
