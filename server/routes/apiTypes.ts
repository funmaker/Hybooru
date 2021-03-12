
// COMMON //

export interface PostSummary {
  id: number;
  hash: string;
}

export interface SearchResults {
  posts: PostSummary[];
  total: number;
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
  posted: string;
  tags: Record<string, number>;
}

export interface Stats {
  posts: number;
  tags: number;
  mappings: number;
  needsTags: number;
}

// PAGES //

export interface IndexPageData {
  stats: Stats;
}

export interface ErrorPageData {
  error: {
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
