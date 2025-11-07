import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    author: z.string().default('Your Name'),
    tags: z.array(z.string()),
    category: z.string(),
    image: z.string().optional(),
    draft: z.boolean().default(false),
    readingTime: z.number().optional(), // minutes
  }),
});

export const collections = {
  blog: blogCollection,
};

