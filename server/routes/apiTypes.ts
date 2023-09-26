
// COMMON //

import { Mime } from "../helpers/consts";
import { Theme } from "../../client/hooks/useTheme";


export interface PostSummary {
  id: number;
  /**
   * @deprecated use `sha256` instead
   */
  hash: string;
  sha256: string;
  extension: string;
  mime: Mime | null;
  posted: string;
  size: number | null;
}

export interface PostSearchResults {
  posts: PostSummary[];
  total: number;
  pageSize: number;
  tags?: Record<string, number>;
}

export interface TagsSearchResults {
  tags: Record<string, number>;
  total: number;
  pageSize: number;
}

export interface TagSummary {
  name: string;
  siblings: string[];
  parents: string[];
  posts: number;
}

export interface TagsSearchFullResults {
  tags: TagSummary[];
  total: number;
  pageSize: number;
}

export enum Relation {
  DUPLICATE = "DUPLICATE",
  DUPLICATE_BEST = "DUPLICATE_BEST",
  ALTERNATE = "ALTERNATE",
}

export interface PostRelation extends PostSummary {
  kind: Relation;
}

export interface PostNote {
  label: string | null;
  note: string;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  } | null;
}

export interface Post {
  id: number;
  /**
   * @deprecated use `sha256` instead
   */
  hash: string;
  sha256: string;
  md5: string;
  extension: string;
  size: number | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  nunFrames: number | null;
  hasAudio: boolean | null;
  rating: number | null;
  mime: Mime | null;
  posted: string;
  tags: Record<string, number>;
  sources: string[];
  relations: PostRelation[];
  notes: PostNote[];
}

export interface Stats {
  posts: number;
  tags: number;
  mappings: number;
  needsTags: number;
}

export interface Config {
  thumbnailSize: [number, number];
  ratingStars: number | null;
  namespaceColors: Record<string, string>;
  appName: string;
  version: string;
  expectMotd: string;
  untaggedQuery: string;
  maxPreviewSize: number;
  passwordSet: boolean;
}

// PAGES //

export interface AnySSRPageData {
  _config: Config;
  _theme: Theme;
  _ssrError: boolean;
  [k: string]: any;
}

export interface IndexPageData {
  stats: Stats;
  updateUrl: string | null;
  motd: PostSummary | null;
}

export interface PostsSearchPageRequest {
  query?: string;
  page?: number;
}

export interface PostsSearchPageData {
  results: PostSearchResults;
}

export interface PostPageData {
  post: Post | null;
}

export interface TagsSearchPageRequest {
  query?: string;
  sorting?: string;
  page?: number;
}

export interface TagsSearchPageData {
  results: TagsSearchFullResults;
}

export interface RandomPageRequest {
  query?: string;
}

export interface RandomPageData {
  redirect: string;
}

export interface ErrorPageData {
  _error: {
    code: number;
    message: string;
    stack?: string;
  };
}

// API //

export interface RegenDBRequest {
  password: string;
}

export interface RegenDBResponse {}

export interface PostsSearchRequest {
  query?: string;
  page?: number;
  pageSize?: number;
}
export type PostsSearchResponse = PostSearchResults;

export type PostsGetResponse = Post | null;

export interface TagsSearchRequest {
  query?: string;
  sorting?: string;
  page?: number;
  pageSize?: number;
  full?: boolean;
}
export type TagsSearchResponse = TagsSearchResults | TagsSearchFullResults;

export interface SetThemeRequest {
  theme: string;
  redirectUrl: string;
}
