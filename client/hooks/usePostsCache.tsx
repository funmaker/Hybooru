import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios, { Canceler } from "axios";
import { PostsSearchPageResponse, PostsSearchRequest, PostsSearchResponse, PostSummary } from "../../types/api";
import requestJSON from "../helpers/requestJSON";
import usePageData from "./usePageData";
import useQuery from "./useQuery";
import useChange from "./useChange";
import useAsyncCallback from "./useAsyncCallback";

export interface PostsCacheEntry {
  key: string | null;
  posts: PostSummary[];
  page: number;
  pageSize: number;
  total: number | null;
  tags: Record<string, number>;
}

type PostsCache = Record<string, PostsCacheEntry>;

interface PostsCacheState {
  postsCache: PostsCache;
  setPostsCache: SetState<PostsCache>;
  setPostsCacheEntry: (entry: PostsCacheEntry) => void;
}

export const PostsCacheContext = React.createContext<PostsCacheState | null>(null);

interface PostsProviderProps {
  children: React.ReactNode;
}

export function PostsCacheProvider({ children }: PostsProviderProps) {
  const [postsCache, setPostsCache] = React.useState<PostsCache>({});
  
  const setPostsCacheEntry = useCallback((entry: PostsCacheEntry) => {
    const key = entry.key;
    if(!key) return;
    
    setPostsCache(cache => ({ ...cache, [key]: entry }));
  }, []);
  
  const state = useMemo(() => ({ postsCache, setPostsCache, setPostsCacheEntry }), [postsCache, setPostsCacheEntry]);
  
  return (
    <PostsCacheContext.Provider value={state}>
      {children}
    </PostsCacheContext.Provider>
  );
}

export default function usePostsCache() {
  "use no memo"; // TODO: react/react/pull/35606 react/react/issues/34131
  
  const postsCacheContext = useContext(PostsCacheContext);
  if(!postsCacheContext) throw new Error("usePostsCache must be used within PostsCacheContext");
  const { postsCache, setPostsCache, setPostsCacheEntry } = postsCacheContext;
  
  const { search, query } = useQuery();
  const key = JSON.stringify([search.page, query]);
  const { pageData, pageError, fetching: pageFetching } = usePageData<PostsSearchPageResponse>(!postsCache[key]);
  const cancelRef = useRef<Canceler | null>(null);
  const [error, setError] = useState(!!pageError);
  const [didRequest, setDidRequest] = useState(false);
  const fresh = !postsCache[key] || didRequest;
  
  const currentCache: PostsCacheEntry = useMemo(() => {
    if(postsCache[key]) return postsCache[key];
    else return {
      key,
      posts: [],
      page: pageData ? 1 : 0,
      pageSize: 1,
      total: null,
      tags: {},
      ...pageData?.results,
    };
  }, [key, pageData, postsCache]);
  
  useChange(query, () => {
    if(cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    setDidRequest(false);
  });
  
  useEffect(() => {
    if(!postsCache[key] && currentCache.total !== null) setPostsCacheEntry(currentCache);
  }, [currentCache, key, postsCache, setPostsCacheEntry]);
  
  const [requestNext, fetching] = useAsyncCallback(async () => {
    if(pageFetching || error || (currentCache.total !== null && currentCache.posts.length >= currentCache.total)) return;
    
    try {
      setDidRequest(true);
      const result = await requestJSON<PostsSearchResponse, PostsSearchRequest>({
        url: "/api/post",
        search: {
          query,
          page: currentCache.page,
          blurhash: true,
        },
        cancelCb: cancel => cancelRef.current = cancel,
      });
      
      setPostsCacheEntry({
        ...currentCache,
        page: currentCache.page + 1,
        posts: [...currentCache.posts, ...result.posts],
        total: result.posts.length === 0 ? currentCache.posts.length : currentCache.total,
      });
    } catch(e) {
      if(!(e instanceof axios.Cancel)) {
        setError(true);
        throw e;
      }
    } finally {
      cancelRef.current = null;
    }
  }, [currentCache, error, pageFetching, query, setPostsCacheEntry]);
  
  const reset = useCallback(() => {
    setPostsCache(({ [key]: value, ...rest }) => rest);
    setError(false);
  }, [key, setPostsCache]);
  
  const resetError = useCallback(() => setError(false), []);
  
  return { postsCache: currentCache, fetching, requestNext, reset, fresh, error, resetError };
}

export function useResetPostsCache() {
  const postsCacheContext = useContext(PostsCacheContext);
  if(!postsCacheContext) throw new Error("usePostsCache must be used within PostsCacheContext");
  const { setPostsCache } = postsCacheContext;
  
  return useCallback(() => setPostsCache({}), [setPostsCache]);
}
