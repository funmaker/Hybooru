import React, { useCallback, useEffect, useRef } from "react";
import useLocationParts from "../../hooks/useLocationParts";
import { qsParse, qsStringify } from "../../helpers/utils";
import useLocalStorage from "../../hooks/useLocalStorage";
import useSSR from "../../hooks/useSSR";
import usePostsCache from "../../hooks/usePostsCache";
import useChange from "../../hooks/useChange";
import Layout from "../../components/Layout";
import Tags from "../../components/Tags";
import Thumbnail from "../../components/Thumbnail";
import Pagination from "../../components/Pagination";
import Spinner from "../../components/Spinner";
import GalleryPopup from "./GalleryPopup";
import "./SearchPage.scss";

export default function SearchPage() {
  const { postsCache, fetching, requestNext, fresh, reset, error, resetError } = usePostsCache();
  const [pagination] = useLocalStorage("pagination", false);
  const [popupEnabled] = useLocalStorage("popup", false);
  const SSR = useSSR();
  const [location, navigate] = useLocationParts();
  const search = qsParse(location.search);
  const popupPushed = useRef(false);
  const scrollRestore = useRef<null | number>(null);
  
  const usePagination = pagination || SSR;
  const pageCount = Math.ceil((postsCache.total || 0) / postsCache.pageSize);
  const end = postsCache.total && postsCache.posts.length >= postsCache.total;
  
  let popup: number | null = parseInt(location.hash);
  if(postsCache.posts.every(post => post.id !== popup) || SSR) popup = null;
  
  const setPopup = useCallback((id: number | null) => {
    if(popupPushed.current && id === null) {
      scrollRestore.current = document.documentElement.scrollTop;
      history.back();
      popupPushed.current = false;
    } else if(popupPushed.current && id !== null) {
      navigate({ ...location, hash: id.toString() }, { replace: true });
    } else if(id !== null && !location.hash) {
      navigate({ ...location, hash: id.toString() });
      popupPushed.current = true;
    } else {
      navigate({ ...location, hash: "" }, { replace: true });
    }
    
    if(id !== null) {
      document.getElementById(id.toString())?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [location, navigate]);
  
  useChange(location.hash, newHash => {
    if(!newHash) popupPushed.current = false;
  });
  
  const checkScroll = useCallback(() => {
    if(usePagination) return;
    
    const body = document.body;
    const html = document.documentElement;
    const bottomPosition = window.pageYOffset + window.innerHeight;
    const bodyHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
    
    if(bodyHeight - bottomPosition < window.innerHeight * 0.25) requestNext().catch(console.error);
  }, [requestNext, usePagination]);
  
  const onThumbnailClick = useCallback((ev: React.MouseEvent, id: number) => {
    if(!popupEnabled) return;
    ev.preventDefault();
    
    setPopup(id);
  }, [popupEnabled, setPopup]);
  
  const onTryAgain = useCallback((ev: React.MouseEvent) => {
    ev.preventDefault();
    resetError();
  }, [resetError]);
  
  useEffect(() => {
    if(!popup && location.hash) setPopup(null);
  }, [location.hash, popup, setPopup]);
  
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
    if(!usePagination && search.page !== undefined) {
      navigate({ ...location, search: qsStringify({ ...search, page: undefined }) });
    }
    if(usePagination && search.page === undefined && postsCache.page > 1) {
      reset();
    }
  }, [location, navigate, postsCache.page, reset, search, usePagination]);
  
  let footer = <div className={`bottomPad${end ? " end" : ""}`} />;
  if(usePagination) footer = <Pagination count={pageCount} />;
  else if(fetching) footer = <Spinner />;
  else if(error) {
    footer = (
      <div className="errorMessage">
        <span>There was an error while fetching next page</span>
        <a href="#" onClick={onTryAgain}>Try Again</a>
      </div>
    );
  }
  
  return (
    <Layout className="SearchPage"
            dimmed={popup !== null}
            extraLink={postsCache.total !== null && <div className="total">Results: {postsCache.total}</div>}
            sidebar={<Tags tags={postsCache.tags} searchMod />}>
      <div className="posts">
        {postsCache.posts.map(post => <Thumbnail key={post.id} post={post} noFade={!fresh} onClick={onThumbnailClick} useId />)}
        {new Array(16).fill(null).map((v, id) => <div key={id} className="placeholder" />)}
      </div>
      {footer}
      <GalleryPopup posts={postsCache.posts} id={popup} setId={setPopup} />
    </Layout>
  );
}
