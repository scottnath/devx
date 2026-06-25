import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { parseFrontmatter } from './frontmatter.js';
import { transformMarkdown } from './transform.js';
import type { BlogPost } from './types.js';

export type { BlogPost } from './types.js';

/** Convert a slug to a record key, replacing unsafe chars and capping length. */
export function slugToRkey(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
}

/** SHA-256 hex digest of the given content. */
export function computeHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Recursively load all markdown/mdx posts under `contentDir`, parsing
 * frontmatter and transforming bodies. Returns posts sorted newest-first.
 * @param contentDir Directory to scan (relative or absolute).
 * @param postPathPrefix URL path prefix, e.g. `/blog`.
 * @param siteUrl Canonical site URL used to resolve root-relative links.
 */
export async function loadBlogPosts(
  contentDir: string,
  postPathPrefix: string,
  siteUrl: string,
): Promise<BlogPost[]> {
  const absDir = resolve(contentDir);
  const posts: BlogPost[] = [];

  async function scan(dir: string): Promise<void> {
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      return;
    }

    for (const name of entries) {
      const filePath = join(dir, name);
      if ((await stat(filePath)).isDirectory()) {
        await scan(filePath);
        continue;
      }
      if (!name.endsWith('.md') && !name.endsWith('.mdx')) continue;

      const raw = await readFile(filePath, 'utf8');
      const { data, content: body } = parseFrontmatter(raw);

      const dateRaw = data.date;
      let date: Date;
      if (dateRaw instanceof Date) date = dateRaw;
      else if (typeof dateRaw === 'string' || typeof dateRaw === 'number') date = new Date(dateRaw);
      else {
        console.warn(`Skipping ${relative(absDir, filePath)}: no valid date`);
        continue;
      }

      const slug = relative(absDir, filePath).replace(/\.(md|mdx)$/, '').replace(/\\/g, '/');
      const postPath = `${postPathPrefix}/${slug}`.replace(/\/+/g, '/');
      const { markdown, textContent } = transformMarkdown(body, siteUrl);

      posts.push({
        slug,
        filePath,
        postPath,
        frontmatter: {
          title: String(data.title ?? slug),
          description: data.description ? String(data.description) : undefined,
          date,
          tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
          draft: data.draft === true,
          crosspost: data.crosspost === false ? false : undefined,
          atprotoUri: data.atprotoUri ? String(data.atprotoUri) : undefined,
          atprotoRkey: data.atprotoRkey ? String(data.atprotoRkey) : undefined,
          bskyPostUri: data.bskyPostUri ? String(data.bskyPostUri) : undefined,
        },
        body,
        contentHash: computeHash(raw),
        markdown,
        textContent,
      });
    }
  }

  await scan(absDir);
  posts.sort((a, b) => b.frontmatter.date.getTime() - a.frontmatter.date.getTime());
  return posts;
}
