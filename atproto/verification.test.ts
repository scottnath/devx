import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  generateDocumentLinkTag,
  readSiteDid,
  writeAtprotoDidWellKnown,
  writePublicationWellKnown,
} from './verification.js';
import { cleanup, makeTmpDir } from '../test/helpers/tmp.js';

describe('generateDocumentLinkTag', () => {
  it('builds an at:// document link tag', () => {
    const tag = generateDocumentLinkTag('did:plc:abc', 'my-rkey');
    assert.strictEqual(
      tag,
      '<link rel="site.standard.document" href="at://did:plc:abc/site.standard.document/my-rkey">',
    );
  });
});

describe('well-known files', () => {
  let dir: string;
  let wellKnown: string;

  beforeEach(() => {
    dir = makeTmpDir();
    wellKnown = join(dir, 'public', '.well-known');
  });

  afterEach(() => cleanup(dir));

  it('writes the publication file with a trailing newline', () => {
    writePublicationWellKnown(wellKnown, 'at://did:plc:abc/site.standard.publication/self  ');
    const content = readFileSync(join(wellKnown, 'site.standard.publication'), 'utf8');
    assert.strictEqual(content, 'at://did:plc:abc/site.standard.publication/self\n');
  });

  it('writes and reads back the atproto-did file', () => {
    writeAtprotoDidWellKnown(wellKnown, '  did:plc:abc  ');
    assert.strictEqual(readSiteDid(wellKnown), 'did:plc:abc');
  });

  it('readSiteDid returns undefined when the file is missing', () => {
    assert.strictEqual(readSiteDid(wellKnown), undefined);
  });
});
