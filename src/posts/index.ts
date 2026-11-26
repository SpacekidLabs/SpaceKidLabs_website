import type { ComponentType } from 'react';
import type { PostMeta } from './types';

export type { PostMeta };

export interface Post {
  meta: PostMeta;
  Body: ComponentType;
}

/**
 * Every archive post lives in its own file in this folder: src/posts/<slug>.tsx.
 * Each file exports `meta` and a default component with the post's content.
 * To add a post, add a file; it is picked up automatically.
 */
const modules = import.meta.glob<{ meta: PostMeta; default: ComponentType }>('./*.tsx', { eager: true });

export const POSTS: Post[] = Object.entries(modules)
  .map(([path, mod]) => {
    const fileSlug = path.replace(/^\.\//, '').replace(/\.tsx$/, '');
    if (mod.meta.slug !== fileSlug) {
      throw new Error(`Post ${path}: meta.slug "${mod.meta.slug}" must match the file name`);
    }
    return { meta: mod.meta, Body: mod.default };
  })
  .sort((a, b) => b.meta.index - a.meta.index);
