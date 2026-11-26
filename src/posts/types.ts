/** Details shown in the archive list and used for sorting, filtering and post URLs. */
export interface PostMeta {
  title: string;
  /** URL part: /archive/<slug>. Must match the file name. */
  slug: string;
  /** YYYY-MM-DD */
  date: string;
  tags: string[];
  /** Sort order in the archive: higher numbers appear first. */
  index: number;
  accentColor?: string;
  /** Highlighted card style. */
  isSpecial?: boolean;
  /** One-line summary for link previews and search results. Defaults to the post's first paragraph. */
  description?: string;
}
