import type { TestContext } from 'node:test';

/** A request the mocked `fetch` received, decoded for assertions. */
export interface RecordedCall {
  url: string;
  method: string;
  body?: unknown;
}

export interface StoredRecord {
  uri: string;
  cid?: string;
  value: Record<string, unknown>;
}

export interface AtpMockOptions {
  /** DID returned by resolveHandle / createSession. */
  did?: string;
  /** PDS service endpoint returned by the DID document. */
  pds?: string;
  /** Records returned by listRecords for `site.standard.publication`. */
  publications?: StoredRecord[];
  /** Records returned by listRecords for `site.standard.document`. */
  documents?: StoredRecord[];
  /** Value returned as `thread` from app.bsky.feed.getPostThread. */
  thread?: unknown;
  /** Posts returned from app.bsky.feed.searchPosts. */
  searchPosts?: unknown[];
  /** Likes returned from app.bsky.feed.getLikes. */
  likes?: unknown[];
  /** Reposters returned from app.bsky.feed.getRepostedBy. */
  repostedBy?: unknown[];
  /** Quote posts returned from app.bsky.feed.getQuotes. */
  quotes?: unknown[];
  /** When true, getPostThread responds 500 (to exercise error handling). */
  threadError?: boolean;
}

export interface AtpMock {
  calls: RecordedCall[];
  did: string;
  pds: string;
  /** Calls whose URL path ends with the given XRPC nsid or path suffix. */
  callsTo(suffix: string): RecordedCall[];
}

/** A real, parseable CID — the lexicon `cid` format validator rejects fakes. */
export const VALID_CID = 'bafyreigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

const pdsService = (endpoint: string, did: string) => ({
  id: did,
  service: [
    {
      id: '#atproto_pds',
      type: 'AtprotoPersonalDataServer',
      serviceEndpoint: endpoint,
    },
  ],
});

/**
 * Installs a `globalThis.fetch` replacement that answers the AT Protocol /
 * Bluesky endpoints used by the atproto module with lexicon-valid responses.
 * Auto-restored via the test context mock tracker.
 */
export function installAtpMock(t: TestContext, opts: AtpMockOptions = {}): AtpMock {
  const did = opts.did ?? 'did:plc:test1234567890';
  const pds = opts.pds ?? 'https://pds.example.com';
  const calls: RecordedCall[] = [];

  const handler = async (input: unknown, init: RequestInit = {}): Promise<Response> => {
    // The authenticated session manager calls fetch(Request); unauthenticated
    // calls and direct fetch() use (URL | string, init).
    let url: string;
    let method: string;
    let rawBody: string | undefined;
    if (input instanceof Request) {
      url = input.url;
      method = input.method.toUpperCase();
      rawBody = await input.clone().text();
    } else {
      url = typeof input === 'string' ? input : String(input);
      method = (init.method ?? 'GET').toUpperCase();
      rawBody = typeof init.body === 'string' ? init.body : undefined;
    }

    let body: unknown;
    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        body = rawBody;
      }
    }
    calls.push({ url, method, body });

    const u = new URL(url);
    const path = u.pathname;
    const rec = body as { collection?: string; rkey?: string } | undefined;

    if (path.endsWith('/xrpc/com.atproto.identity.resolveHandle')) {
      return json({ did });
    }
    if (u.host === 'plc.directory' || path.endsWith('/.well-known/did.json')) {
      return json(pdsService(pds, did));
    }
    if (path.endsWith('/xrpc/com.atproto.server.createSession')) {
      return json({
        did,
        handle: 'tester.example.com',
        accessJwt: 'access-jwt',
        refreshJwt: 'refresh-jwt',
        active: true,
      });
    }
    if (path.endsWith('/xrpc/com.atproto.repo.listRecords')) {
      const collection = u.searchParams.get('collection');
      const source =
        collection === 'site.standard.publication'
          ? opts.publications
          : collection === 'site.standard.document'
            ? opts.documents
            : [];
      const records = (source ?? []).map((r) => ({
        uri: r.uri,
        cid: r.cid ?? VALID_CID,
        value: r.value,
      }));
      return json({ records });
    }
    if (path.endsWith('/xrpc/com.atproto.repo.createRecord')) {
      const collection = rec?.collection ?? 'unknown';
      const rkey = `rkey-${calls.length}`;
      return json({ uri: `at://${did}/${collection}/${rkey}`, cid: VALID_CID });
    }
    if (path.endsWith('/xrpc/com.atproto.repo.putRecord')) {
      const collection = rec?.collection ?? 'unknown';
      const rkey = rec?.rkey ?? 'rkey';
      return json({ uri: `at://${did}/${collection}/${rkey}`, cid: VALID_CID });
    }
    if (path.endsWith('/xrpc/com.atproto.repo.deleteRecord')) {
      return json({});
    }
    if (path.endsWith('/xrpc/com.atproto.repo.uploadBlob')) {
      return json({
        blob: {
          $type: 'blob',
          ref: { $link: VALID_CID },
          mimeType: 'image/png',
          size: 1024,
        },
      });
    }
    if (path.endsWith('/xrpc/app.bsky.feed.getPostThread')) {
      if (opts.threadError) return json({ error: 'InternalServerError' }, 500);
      const thread = opts.thread ?? {
        $type: 'app.bsky.feed.defs#notFoundPost',
        uri: u.searchParams.get('uri') ?? `at://${did}/app.bsky.feed.post/missing`,
        notFound: true,
      };
      return json({ thread });
    }
    if (path.endsWith('/xrpc/app.bsky.feed.searchPosts')) {
      return json({ posts: opts.searchPosts ?? [] });
    }
    if (path.endsWith('/xrpc/app.bsky.feed.getLikes')) {
      return json({
        uri: u.searchParams.get('uri') ?? '',
        likes: opts.likes ?? [],
        cursor: undefined,
      });
    }
    if (path.endsWith('/xrpc/app.bsky.feed.getRepostedBy')) {
      return json({
        uri: u.searchParams.get('uri') ?? '',
        repostedBy: opts.repostedBy ?? [],
        cursor: undefined,
      });
    }
    if (path.endsWith('/xrpc/app.bsky.feed.getQuotes')) {
      return json({
        uri: u.searchParams.get('uri') ?? '',
        posts: opts.quotes ?? [],
        cursor: undefined,
      });
    }

    return json({ error: 'NotMocked', message: `No mock for ${method} ${path}` }, 404);
  };

  t.mock.method(globalThis, 'fetch', handler as typeof fetch);

  return {
    calls,
    did,
    pds,
    callsTo: (suffix) => calls.filter((c) => new URL(c.url).pathname.endsWith(suffix)),
  };
}
