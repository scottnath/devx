/**
 * Blog collection for Workflow A. Workflow B (Bluesky ingest) is not shipped —
 * add when a site needs it.
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    draft: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    atprotoUri: z.string().optional(),
    atprotoRkey: z.string().optional(),
    bskyPostUri: z.string().optional(),
    crosspost: z.boolean().optional(),
    ogImage: z.string().optional(),
  }),
});

export const collections = { blog };
