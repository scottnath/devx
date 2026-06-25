import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Parse YAML-ish frontmatter from a markdown string. Supports scalars,
 * booleans, and simple inline arrays. Returns empty data when absent.
 */
export function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  if (!raw.startsWith('---\n')) return { data: {}, content: raw };
  const end = raw.indexOf('\n---\n', 4);
  if (end === -1) return { data: {}, content: raw };

  const data: Record<string, unknown> = {};
  for (const line of raw.slice(4, end).split('\n')) {
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val: unknown = m[2].trim();
    if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (typeof val === 'string' && val.startsWith('[') && val.endsWith(']')) {
      val = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else if (typeof val === 'string') {
      val = val.replace(/^["']|["']$/g, '');
    }
    data[key] = val;
  }
  return { data, content: raw.slice(end + 5) };
}

/** Serialize frontmatter data and body back into a markdown string. */
export function stringifyFrontmatter(data: Record<string, unknown>, content: string): string {
  const lines = ['---'];
  for (const [key, val] of Object.entries(data)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) {
      lines.push(`${key}:`);
      for (const item of val) lines.push(`  - ${item}`);
    } else {
      lines.push(`${key}: ${val}`);
    }
  }
  lines.push('---', '');
  return `${lines.join('\n')}${content}`;
}

/**
 * Apply frontmatter updates to a file in place. Keys with an `undefined` value
 * are deleted; others are added or overwritten.
 */
export function updatePostFrontmatter(
  filePath: string,
  updates: Record<string, string | undefined>,
): void {
  const raw = readFileSync(filePath, 'utf8');
  const { data, content } = parseFrontmatter(raw);
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) delete data[key];
    else data[key] = value;
  }
  writeFileSync(filePath, stringifyFrontmatter(data, content));
}
