// COMMON //

import { Mime } from "../server/helpers/consts";
import { Theme } from "../client/hooks/useTheme";

export interface PostSummary {
  id: number;
  /**
   * @deprecated use `sha256` instead
   */
  hash?: string;
  sha256: string;
  md5?: string | null;
  blurhash?: string | null;
  width?: number | null;
  height?: number | null;
  size?: number | null;
  extension: string;
  mime: Mime | null;
  posted: string;
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
  md5: string | null;
  blurhash: string | null;
  extension: string;
  size: number | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  numFrames: number | null;
  hasAudio: boolean | null;
  rating: number | null;
  mime: Mime | null;
  inbox: boolean;
  trash: boolean;
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

export enum ThumbnailsMode {
  FILL = "fill",
  FIT = "fit",
}

export interface Config {
  thumbnailSize: [number, number];
  ratingStars: number | null;
  namespaceColors: Record<string, string>;
  appName: string;
  version: string;
  expectMotd: boolean;
  untaggedQuery: string;
  maxPreviewSize: number;
  passwordSet: boolean;
  thumbnailsMode: ThumbnailsMode;
  busy: boolean;
  sortPresets: string[];
  honeyPot: {
    ip: string;
  } | null;
}

// PAGES //

export interface InitialData {
  _config: Config;
  _theme: Theme;
  _ssrError: boolean;
  _error?: ErrorResponse;
  [k: string]: any;
}

export interface IndexPageResponse {
  stats: Stats;
  updateUrl: string | null;
  motd: PostSummary | null;
}

export interface PostsSearchPageRequest {
  query?: string;
  page?: number;
}

export interface PostsSearchPageResponse {
  results: PostSearchResults;
}

export interface PostPageResponse {
  post: Post;
}

export interface TagsSearchPageRequest {
  query?: string;
  sorting?: string;
  page?: number;
}

export interface TagsSearchPageResponse {
  results: TagsSearchFullResults;
}

export interface RandomPageRequest {
  query?: string;
}

export interface RandomPageResponse {
  redirect: string;
}

export interface LockPageRequest {
  redirect?: string;
}

export interface LockPageResponse {
  isLocked: boolean;
  lockName: string | null;
  redirect: string;
}

export interface ErrorResponse {
  code: number;
  message: string;
  stack?: string;
}

// API //

export interface PasswordRequest {
  password: string;
}

export type RegenDBRequest = PasswordRequest;

export interface RegenDBResponse {
  ok: true;
}

export type DiagnosticsRequest = PasswordRequest;
export type SQLQueryPlan = any;

export interface ImportStatsStep {
  name: string;
  time: number[];
}

export interface ImportStats {
  steps: ImportStatsStep[];
  siblingLoops: number | null;
  parentLoops: number | null;
}

export interface DiagnosticsResponse {
  benchmark: {
    _SIZES: number[]; // eslint-disable-line @typescript-eslint/naming-convention
    [plan: string]: SQLQueryPlan[];
  };
  importStats: ImportStats;
  stats: Stats;
}

export interface PostsSearchRequest {
  query?: string;
  page?: number;
  pageSize?: number;
  hashes?: boolean;
  blurhash?: boolean;
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

// WEBSOCKETS //

export interface ProgressMessage {
  name: string;
  value: number;
  target: number;
}

export interface WebSocketMessageMap {
  progress: ProgressMessage;
  end: Config;
}

export type WebSocketMessage = {
  [Name in keyof WebSocketMessageMap]: { type: Name; data: WebSocketMessageMap[Name] };
}[keyof WebSocketMessageMap];
