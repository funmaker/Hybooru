
// COMMON //

import { Mime } from "../helpers/consts";

export interface PostSummary {
  id: number;
  hash: string;
  mime: Mime | null;
}

export interface SearchResults {
  posts: PostSummary[];
  total: number;
  pageSize: number;
  tags?: Record<string, number>;
}

export interface Post {
  id: number;
  hash: string;
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
}

export interface Stats {
  posts: number;
  tags: number;
  mappings: number;
  needsTags: number;
}

export interface Config {
  thumbnailSize: [number, number];
  namespaceColors: Record<string, string>;
  appName: string;
}

// PAGES //

export interface IndexPageData {
  stats: Stats;
}

export interface SearchPageRequest {
  query?: string;
  page?: number;
}

export interface SearchPageData {
  results: SearchResults;
}

export interface PostPageData {
  post: Post | null;
}

export interface ErrorPageData {
  _error: {
    code: number;
    message: string;
    stack?: string;
  };
}

// API //

export interface RegenDBResponse {}

export interface PostsSearchRequest {
  query?: string;
  page?: number;
}
export type PostsSearchResponse = SearchResults;

export type PostsGetResponse = Post | null;
