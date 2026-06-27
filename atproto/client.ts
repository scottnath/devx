import { AtpAgent } from '@atproto/api';
import { getPdsEndpoint, isValidDidDoc } from '@atproto/common-web';
import type {
  CreatedDocument,
  DocumentInput,
  PublicationInput,
  PublicationSummary,
  StoredDocument,
} from './types.js';

const PUBLIC_API = 'https://public.api.bsky.app';

/**
 * A thin, owned wrapper around `AtpAgent` for the `site.standard.*` collections.
 * Construct via {@link AtprotoClient.login}.
 */
export class AtprotoClient {
  private agent: AtpAgent | null = null;
  /** DID of the authenticated repo. */
  readonly did: string;

  private constructor(did: string, agent: AtpAgent) {
    this.did = did;
    this.agent = agent;
  }

  /**
   * Resolve the identifier's PDS, log in, and return a ready client.
   * @param identifier ATProto handle or DID.
   * @param password App password (not the account password).
   */
  static async login(identifier: string, password: string): Promise<AtprotoClient> {
    const agent = new AtpAgent({ service: await resolvePds(identifier) });
    await agent.login({ identifier, password });
    const did = agent.session?.did;
    if (!did) throw new Error('Login failed: no DID in session');
    return new AtprotoClient(did, agent);
  }

  /** Return the underlying agent, or throw if not logged in. */
  getAgent(): AtpAgent {
    if (!this.agent) throw new Error('Not logged in');
    return this.agent;
  }

  /**
   * Return the AT-URI of the publication matching `input.url`, creating it if
   * none exists.
   */
  async ensurePublication(input: PublicationInput): Promise<string> {
    const agent = this.getAgent();
    const existing = await this.listPublications();
    const match = existing.find((p) => p.url === input.url);
    if (match) return match.uri;

    const res = await agent.com.atproto.repo.createRecord({
      repo: this.did,
      collection: 'site.standard.publication',
      record: {
        $type: 'site.standard.publication',
        url: input.url,
        name: input.name,
        description: input.description,
      },
    });
    return res.data.uri;
  }

  /** List all `site.standard.publication` records in the repo. */
  async listPublications(): Promise<PublicationSummary[]> {
    const agent = this.getAgent();
    const res = await agent.com.atproto.repo.listRecords({
      repo: this.did,
      collection: 'site.standard.publication',
      limit: 50,
    });
    return res.data.records.map((r) => ({
      uri: r.uri,
      url: (r.value as { url?: string }).url ?? '',
    }));
  }

  /** List all `site.standard.document` records in the repo. */
  async listDocuments(): Promise<StoredDocument[]> {
    const agent = this.getAgent();
    const res = await agent.com.atproto.repo.listRecords({
      repo: this.did,
      collection: 'site.standard.document',
      limit: 100,
    });
    return res.data.records.map((r) => {
      const value = r.value as Pick<StoredDocument, 'path' | 'bskyPostRef'>;
      return {
        uri: r.uri,
        rkey: r.uri.split('/').pop()!,
        path: value.path,
        bskyPostRef: value.bskyPostRef,
      };
    });
  }

  /** Create or overwrite a document at the given rkey. Returns its AT-URI. */
  async putDocument(rkey: string, input: DocumentInput): Promise<string> {
    const res = await this.getAgent().com.atproto.repo.putRecord({
      repo: this.did,
      collection: 'site.standard.document',
      rkey,
      record: documentRecord(input, { updatedAt: new Date().toISOString() }),
    });
    return res.data.uri;
  }

  /** Create a document with a server-assigned rkey. */
  async createDocument(input: DocumentInput): Promise<CreatedDocument> {
    const res = await this.getAgent().com.atproto.repo.createRecord({
      repo: this.did,
      collection: 'site.standard.document',
      record: documentRecord(input),
    });
    const rkey = res.data.uri.split('/').pop()!;
    return { uri: res.data.uri, rkey };
  }

  /** Delete the document with the given rkey. */
  async deleteDocument(rkey: string): Promise<void> {
    await this.getAgent().com.atproto.repo.deleteRecord({
      repo: this.did,
      collection: 'site.standard.document',
      rkey,
    });
  }
}

/** Build a `site.standard.document` record, stripping undefined fields. */
function documentRecord(
  input: DocumentInput,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const record: Record<string, unknown> = {
    $type: 'site.standard.document',
    site: input.site,
    title: input.title,
    path: input.path,
    publishedAt: input.publishedAt,
    textContent: input.textContent,
    description: input.description,
    tags: input.tags,
    content: {
      $type: 'site.standard.content.markdown',
      text: input.markdown,
      version: '1.0',
    },
    bskyPostRef: input.bskyPostRef,
    ...extra,
  };
  return Object.fromEntries(Object.entries(record).filter(([, v]) => isPresent(v)));
}

/** Keep fields that should be written to the PDS record. */
function isPresent(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/** Resolve a handle to its DID via the public API. */
async function resolveHandle(handle: string): Promise<string> {
  const res = await fetch(
    `${PUBLIC_API}/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`,
  );
  if (!res.ok) throw new Error(`Failed to resolve handle: ${handle}`);
  const data = (await res.json()) as { did: string };
  return data.did;
}

/** Resolve a DID to its PDS service endpoint via plc.directory or did:web. */
async function getPdsFromDid(did: string): Promise<string> {
  let didDoc: unknown;
  if (did.startsWith('did:plc:')) {
    const res = await fetch(`https://plc.directory/${did}`);
    if (!res.ok) throw new Error(`Failed to resolve DID: ${did}`);
    didDoc = await res.json();
  } else if (did.startsWith('did:web:')) {
    const domain = did.replace('did:web:', '');
    const res = await fetch(`https://${domain}/.well-known/did.json`);
    if (!res.ok) throw new Error(`Failed to resolve DID: ${did}`);
    didDoc = await res.json();
  } else {
    throw new Error(`Unsupported DID method: ${did}`);
  }
  if (!isValidDidDoc(didDoc)) throw new Error(`Invalid DID document for ${did}`);
  const endpoint = getPdsEndpoint(didDoc);
  if (!endpoint) throw new Error(`No PDS found for ${did}`);
  return endpoint;
}

/** Resolve an identifier (handle or DID) to its PDS service endpoint. */
async function resolvePds(identifier: string): Promise<string> {
  const did = identifier.startsWith('did:') ? identifier : await resolveHandle(identifier);
  return getPdsFromDid(did);
}
