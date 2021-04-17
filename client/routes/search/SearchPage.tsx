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
import GalleryPopup from "./GalleryPopup";
import "./SearchPage.scss";

export default function SearchPage() {
  const { postsCache, fetching, requestNext, reset } = usePostsCache();
  const [pagination] = useLocalStorage("pagination", false);
  const [popupEnabled] = useLocalStorage("popup", false);
  const SSR = useSSR();
  const history = useHistory();
  const search = useSearch();
  const lastPostsCache = useRef<null | PostsCacheData>(null);
  const popupPushed = useRef(false);
  const scrollRestore = useRef<null | number>(null);
  const imageFade = postsCache === lastPostsCache.current;
  lastPostsCache.current = postsCache;
  
  const usePagination = pagination || SSR || search.page !== undefined;
  const pageCount = Math.ceil((postsCache.total || 0) / postsCache.pageSize);
  const end = postsCache.total && postsCache.posts.length >= postsCache.total;
  
  let popup: number | null = parseInt(history.location.hash.slice(1));
  if(isNaN(popup) || popup >= postsCache.posts.length) popup = null;
  
  useEffect(() => {
    if(history.location.hash && popup === null) history.replace({ ...history.location, hash: "" });
  }, [history, popup]);
  
  useEffect(() => {
    return history.listen(() => {
      requestAnimationFrame(() => {
        if(scrollRestore.current !== null) {
          document.documentElement.scrollTop = scrollRestore.current;
          scrollRestore.current = null;
        }
      });
    });
  }, [history]);
  
  const setPopup = useCallback((id: number | null) => {
    if(popupPushed.current && id === null) {
      scrollRestore.current = document.documentElement.scrollTop;
      history.goBack();
      popupPushed.current = false;
    } else if(popupPushed.current && id !== null) {
      history.replace({ ...history.location, hash: id.toString() });
    } else if(id !== null) {
      history.push({ ...history.location, hash: id.toString() });
      popupPushed.current = true;
    } else {
      history.replace({ ...history.location, hash: "" });
    }
    
    if(id !== null && lastPostsCache.current?.posts[id]) {
      const postId = lastPostsCache.current.posts[id].id;
      document.getElementById(postId.toString())?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [history]);
  
  const checkScroll = useCallback(() => {
    if(usePagination) return;
    
    const body = document.body;
    const html = document.documentElement;
    const bottomPosition = window.pageYOffset + window.innerHeight;
    const bodyHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
    
    if(bodyHeight - bottomPosition < window.innerHeight * 0.25) requestNext();
  }, [requestNext, usePagination]);
  
  const onThumbnailClick = useCallback((ev: React.MouseEvent, id: number) => {
    if(!popupEnabled) return;
    ev.preventDefault();
    
    setPopup(id);
  }, [popupEnabled, setPopup]);
  
  useEffect(() => checkScroll(), [checkScroll, postsCache]);
  useEffect(() => {
    checkScroll();
    document.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      document.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
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
    <Layout className="SearchPage" options dimmed={popup !== null}
            extraLink={postsCache.total !== null && <div className="total">Results: {postsCache.total}</div>}
            sidebar={<Tags tags={postsCache.tags} searchMod />}>
      <div className="posts">
        {postsCache.posts.map((post, id) => <Thumbnail key={post.id} id={id} post={post} noFade={!imageFade} onClick={onThumbnailClick} useId />)}
        {new Array(16).fill(null).map((v, id) => <div key={id} className="placeholder" />)}
      </div>
      {footer}
      <GalleryPopup posts={postsCache.posts} id={popup} setId={setPopup} />
    </Layout>
  );
}
