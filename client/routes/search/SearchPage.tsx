import React, { useCallback, useEffect, useRef } from "react";
import { useHistory } from "react-router";
import qs from "query-string";
import useLocalStorage from "../../hooks/useLocalStorage";
import useSSR from "../../hooks/useSSR";
import useSearch from "../../hooks/useSearch";
import usePostsCache, { PostsCacheData } from "../../hooks/usePostsCache";
import Layout from "../../components/Layout";
import Tags from "../../components/Tags";
import Thumbnail from "../../components/Thumbnail";
import Pagination from "../../components/Pagination";
import Spinner from "../../components/Spinner";
import "./SearchPage.scss";

export default function SearchPage() {
  const { postsCache, fetching, requestNext, reset } = usePostsCache();
  const [pagination] = useLocalStorage("pagination", false);
  const SSR = useSSR();
  const history = useHistory();
  const search = useSearch();
  const lastPostsCache = useRef<null | PostsCacheData>(null);
  const imageFade = postsCache === lastPostsCache.current;
  lastPostsCache.current = postsCache;
  
  const usePagination = pagination || SSR || search.page !== undefined;
  const pageCount = Math.ceil((postsCache.total || 0) / postsCache.pageSize);
  const end = postsCache.total && postsCache.posts.length >= postsCache.total;
  
  const checkScroll = useCallback(() => {
    if(usePagination) return;
    
    const body = document.body;
    const html = document.documentElement;
    const bottomPosition = window.pageYOffset + window.innerHeight;
    const bodyHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
    
    if(bodyHeight - bottomPosition < window.innerHeight * 0.25) requestNext();
  }, [requestNext, usePagination]);
  
  useEffect(() => checkScroll(), [checkScroll, postsCache]);
  useEffect(() => {
    checkScroll();
    document.addEventListener("scroll", checkScroll);
    return () => document.removeEventListener("scroll", checkScroll);
  }, [checkScroll]);
  
  useEffect(() => {
    if(!pagination && search.page !== undefined) {
      history.replace(`?${qs.stringify({ ...search, page: undefined })}`);
    } else if(pagination && postsCache.page > 1) {
      reset();
    }
  }, [history, pagination, postsCache.page, reset, search]);
  
  let footer = <div className={`bottomPad${end ? " end" : ""}`} />;
  if(usePagination) footer = <Pagination count={pageCount} />;
  else if(fetching) footer = <Spinner />;
  
  return (
    <Layout className="SearchPage" options
            extraLink={postsCache.total !== null && <div className="total">Results: {postsCache.total}</div>}
            sidebar={<Tags tags={postsCache.tags} searchMod />}>
      <div className="posts">
        {postsCache.posts.map(post => <Thumbnail key={post.id} post={post} noFade={!imageFade} />)}
        {new Array(16).fill(null).map((v, id) => <div key={id} className="placeholder" />)}
      </div>
      {footer}
    </Layout>
  );
}
