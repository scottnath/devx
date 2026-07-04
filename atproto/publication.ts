import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import type { AtpAgent } from '@atproto/api';
import type {
  AtprotoBasicTheme,
  PublicationInput,
  PublicationSummary,
  RgbColorInput,
} from './types.js';

const COLLECTION = 'site.standard.publication';

/** List all `site.standard.publication` records in the repo. */
export async function listPublications(
  agent: AtpAgent,
  did: string,
): Promise<PublicationSummary[]> {
  const res = await agent.com.atproto.repo.listRecords({
    repo: did,
    collection: COLLECTION,
    limit: 50,
  });
  return res.data.records.map((r) => ({
    uri: r.uri,
    rkey: r.uri.split('/').pop()!,
    url: (r.value as { url?: string }).url ?? '',
    value: r.value as Record<string, unknown>,
  }));
}

/**
 * Return the AT-URI of the publication matching `input.url`, creating it if
 * none exists and updating it in place when its metadata (name, description,
 * theme, labels, preferences, or a not-yet-set icon) has changed.
 *
 * The icon is uploaded once — when the record has none yet, or when `force`
 * is set — since a local file cannot be cheaply diffed against a stored blob.
 */
export async function ensurePublication(
  agent: AtpAgent,
  did: string,
  input: PublicationInput,
  options: { force?: boolean } = {},
): Promise<string> {
  const existing = (await listPublications(agent, did)).find((p) => p.url === input.url);

  const existingIcon = existing?.value.icon;
  const uploadIcon = !!input.iconPath && (!existingIcon || !!options.force);
  const iconBlob = uploadIcon ? await uploadImageBlob(agent, input.iconPath!) : (existingIcon ?? undefined);

  const record = buildPublicationRecord(input, iconBlob);

  if (!existing) {
    const res = await agent.com.atproto.repo.createRecord({ repo: did, collection: COLLECTION, record });
    return res.data.uri;
  }

  if (options.force || uploadIcon || !recordsEqual(existing.value, record)) {
    await agent.com.atproto.repo.putRecord({
      repo: did,
      collection: COLLECTION,
      rkey: existing.rkey,
      record,
    });
  }
  return existing.uri;
}

/** Build a `site.standard.publication` record, stripping absent fields. */
export function buildPublicationRecord(
  input: PublicationInput,
  iconBlob?: unknown,
): Record<string, unknown> {
  const record: Record<string, unknown> = {
    $type: COLLECTION,
    url: input.url,
    name: input.name,
    description: input.description,
    icon: iconBlob,
    basicTheme: input.theme ? buildBasicTheme(input.theme) : undefined,
    labels: input.labels && input.labels.length ? buildSelfLabels(input.labels) : undefined,
    preferences:
      input.showInDiscover === undefined ? undefined : { showInDiscover: input.showInDiscover },
  };
  return Object.fromEntries(Object.entries(record).filter(([, v]) => isPresent(v)));
}

/** Upload a local image file as a blob and return its blob ref. */
async function uploadImageBlob(agent: AtpAgent, path: string): Promise<unknown> {
  const bytes = readFileSync(path);
  const res = await agent.uploadBlob(bytes, { encoding: imageMime(path) });
  return res.data.blob;
}

/** Guess an `image/*` mime type from a file extension (default `image/png`). */
function imageMime(path: string): string {
  const ext = extname(path).toLowerCase();
  const map: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.avif': 'image/avif',
  };
  return map[ext] ?? 'image/png';
}

/** Build the embedded `site.standard.theme.basic` value from theme colors. */
function buildBasicTheme(theme: AtprotoBasicTheme): Record<string, unknown> {
  return {
    $type: 'site.standard.theme.basic',
    accent: toRgb(theme.accent),
    background: toRgb(theme.background),
    foreground: toRgb(theme.foreground),
    accentForeground: toRgb(theme.accentForeground),
  };
}

/** Convert a hex string or `{ r, g, b }` to a `site.standard.theme.color#rgb` value. */
function toRgb(color: RgbColorInput): { $type: string; r: number; g: number; b: number } {
  const rgb = typeof color === 'string' ? parseHexColor(color) : color;
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return { $type: 'site.standard.theme.color#rgb', r: clamp(rgb.r), g: clamp(rgb.g), b: clamp(rgb.b) };
}

/** Parse `#rgb` / `#rrggbb` (with or without leading `#`) into channel values. */
function parseHexColor(hex: string): { r: number; g: number; b: number } {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Invalid hex color: ${hex}`);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Build a `com.atproto.label.defs#selfLabels` value from label names. */
function buildSelfLabels(labels: string[]): Record<string, unknown> {
  return {
    $type: 'com.atproto.label.defs#selfLabels',
    values: labels.map((val) => ({ val })),
  };
}

/**
 * Compare a desired record against a stored one, ignoring the `icon` blob
 * (blobs are governed by upload policy, not diffed by value) so unchanged
 * metadata does not trigger a needless write.
 */
function recordsEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const strip = ({ icon: _icon, ...rest }: Record<string, unknown>) => stableStringify(rest);
  return strip(a) === strip(b);
}

/** Deterministic JSON with keys sorted at every depth, for stable comparison. */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

/**
 * Keep record fields that should be written to the PDS: drops `undefined`,
 * `null`, empty strings, and empty arrays. Shared by document and publication
 * record builders.
 */
export function isPresent(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}
