/** Strip markdown/mdx syntax to plain text for standard.site `textContent`. */
export function toPlainText(markdown: string): string {
  return markdown
    .replaceAll(/```[\s\S]*?```/g, ' ')
    .replaceAll(/^(?:import|export)\s.+$/gm, ' ')
    .replaceAll(/<([A-Za-z][\w-]*)\b[^>]*>[\s\S]*?<\/\1>/g, ' ')
    .replaceAll(/<[A-Za-z][^>]*\/?>/g, ' ')
    .replaceAll(/^:::.*$/gm, ' ')
    .replaceAll(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replaceAll(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replaceAll(/`([^`]+)`/g, '$1')
    .replaceAll(/^\s{0,3}#{1,6}\s+/gm, '')
    .replaceAll(/^\s{0,3}>\s?/gm, '')
    .replaceAll(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, '')
    .replaceAll(/(\*\*|__|\*|_|~~)/g, '')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

/** Rewrite root-relative markdown links and images to absolute `siteUrl` URLs. */
export function resolveRelativeLinks(markdown: string, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, '');
  return markdown
    .replace(/\[([^\]]*)\]\(\/([^)]*)\)/g, `[$1](${base}/$2)`)
    .replace(/!\[([^\]]*)\]\(\/([^)]*)\)/g, `![$1](${base}/$2)`);
}

/** Resolve relative links and derive plain text in one pass. */
export function transformMarkdown(body: string, siteUrl: string): { markdown: string; textContent: string } {
  const markdown = resolveRelativeLinks(body, siteUrl);
  return { markdown, textContent: toPlainText(markdown) };
}
