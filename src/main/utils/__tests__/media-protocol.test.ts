import type * as fs from 'fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { handleMock, registerSchemesAsPrivilegedMock, statMock } = vi.hoisted(() => ({
  handleMock: vi.fn(),
  registerSchemesAsPrivilegedMock: vi.fn(),
  statMock: vi.fn(),
}));

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
      promises: {
        ...actual.promises,
        stat: statMock,
      },
    },
    promises: {
      ...actual.promises,
      stat: statMock,
    },
  };
});

async function loadMediaProtocolModule() {
  vi.resetModules();
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

function createProtocolRequest(url: string): Request {
  return {
    url,
    method: 'GET',
    headers: new Headers(),
  } as Request;
}

describe('media-protocol', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-07T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
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
    expect(await response.text()).toBe('Unable to load media source');
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
});
