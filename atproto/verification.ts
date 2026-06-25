import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

/** Build the `<link rel="site.standard.document">` tag for a post's head. */
export function generateDocumentLinkTag(did: string, documentRkey: string): string {
  const href = `at://${did}/site.standard.document/${documentRkey}`;
  return `<link rel="site.standard.document" href="${href}">`;
}

/** Write the `.well-known/site.standard.publication` file (creating the dir). */
export function writePublicationWellKnown(wellKnownDir: string, publicationAtUri: string): void {
  mkdirSync(wellKnownDir, { recursive: true });
  writeFileSync(`${wellKnownDir}/site.standard.publication`, `${publicationAtUri.trim()}\n`);
}

/** Write the `.well-known/atproto-did` file (creating the dir). */
export function writeAtprotoDidWellKnown(wellKnownDir: string, did: string): void {
  mkdirSync(wellKnownDir, { recursive: true });
  writeFileSync(`${wellKnownDir}/atproto-did`, `${did.trim()}\n`);
}

/** Read the site DID from `.well-known/atproto-did`, or `undefined` if absent. */
export function readSiteDid(wellKnownDir: string): string | undefined {
  try {
    return readFileSync(`${wellKnownDir}/atproto-did`, 'utf8').trim() || undefined;
  } catch {
    return undefined;
  }
}
