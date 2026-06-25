import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  resolveRelativeLinks,
  toPlainText,
  transformMarkdown,
} from './transform.js';

describe('toPlainText', () => {
  it('strips headings, emphasis, and inline code', () => {
    const md = '# Title\n\nSome **bold** and _italic_ and `code` text.';
    assert.strictEqual(toPlainText(md), 'Title Some bold and italic and code text.');
  });

  it('keeps link and image alt text but drops urls', () => {
    const md = 'See [my site](https://example.com) and ![alt text](/img.png).';
    assert.strictEqual(toPlainText(md), 'See my site and alt text.');
  });

  it('removes fenced code blocks entirely', () => {
    const md = 'before\n\n```js\nconst x = 1;\n```\n\nafter';
    assert.strictEqual(toPlainText(md), 'before after');
  });

  it('removes mdx import/export lines, jsx, and directives', () => {
    const md = [
      "import Foo from './Foo.astro'",
      'export const x = 1',
      '<Foo prop="a">inner</Foo>',
      '<img src="/a.png" />',
      ':::note',
      'real content',
    ].join('\n');
    assert.strictEqual(toPlainText(md), 'real content');
  });

  it('flattens lists and blockquotes and collapses whitespace', () => {
    const md = '- one\n- two\n\n> quoted\n\n1. first\n2. second';
    assert.strictEqual(toPlainText(md), 'one two quoted first second');
  });

  it('returns empty string for empty input', () => {
    assert.strictEqual(toPlainText(''), '');
  });
});

describe('resolveRelativeLinks', () => {
  it('rewrites root-relative links to absolute', () => {
    const out = resolveRelativeLinks('[a](/blog/post)', 'https://example.com');
    assert.strictEqual(out, '[a](https://example.com/blog/post)');
  });

  it('rewrites root-relative images to absolute', () => {
    const out = resolveRelativeLinks('![alt](/img.png)', 'https://example.com');
    assert.strictEqual(out, '![alt](https://example.com/img.png)');
  });

  it('strips a trailing slash from the site url', () => {
    const out = resolveRelativeLinks('[a](/x)', 'https://example.com/');
    assert.strictEqual(out, '[a](https://example.com/x)');
  });

  it('leaves absolute and relative-non-root links untouched', () => {
    const input = '[a](https://other.com/x) and [b](../rel)';
    assert.strictEqual(resolveRelativeLinks(input, 'https://example.com'), input);
  });
});

describe('transformMarkdown', () => {
  it('returns resolved markdown and plain text content', () => {
    const { markdown, textContent } = transformMarkdown(
      '# Hi\n\nSee [here](/x).',
      'https://example.com',
    );
    assert.strictEqual(markdown, '# Hi\n\nSee [here](https://example.com/x).');
    assert.strictEqual(textContent, 'Hi See here.');
  });
});
