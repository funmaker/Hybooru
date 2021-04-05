import React, { useEffect, useReducer, useRef, useState } from "react";
import axios, { Canceler } from "axios";
import { useHistory } from "react-router";
import qs from "query-string";
import { PostsSearchRequest, PostsSearchResponse, PostSummary, PostsSearchPageData, PostSearchResults } from "../../../server/routes/apiTypes";
import requestJSON from "../../helpers/requestJSON";
import usePageData from "../../hooks/usePageData";
import useLocalStorage from "../../hooks/useLocalStorage";
import useSSR from "../../hooks/useSSR";
import useSearch from "../../hooks/useSearch";
import Layout from "../../components/Layout";
import Tags from "../../components/Tags";
import Thumbnail from "../../components/Thumbnail";
import Pagination from "../../components/Pagination";
import Spinner from "../../components/Spinner";
import "./SearchPage.scss";

function pagesReducer(state: PostSummary[][], action: { posts: PostSummary[]; reset?: boolean }) {
  if(action.reset) return [action.posts];
  else return [...state, action.posts];
}

export default function SearchPage() {
  const [pageData] = usePageData<PostsSearchPageData>();
  const [pagination] = useLocalStorage("pagination", false);
  const SSR = useSSR();
  const curPage = useRef(0);
  const search = useSearch();
  const query = typeof search.query === "string" ? search.query : "";
  const history = useHistory();
  const [firstPage, setFirstPage] = useState<PostSearchResults>(pageData?.results || { posts: [], pageSize: 1, tags: {}, total: 0 });
  const [pages, pagesDispatch] = useReducer(pagesReducer, pageData?.results.posts ? [pageData?.results.posts] : []);
  const [fetchCancel, setFetchCancel] = useState<null | Canceler>(null);
  
  const usePagination = pagination || SSR;
  const pageCount = Math.ceil(firstPage.total / firstPage.pageSize);
  const end = pages.length >= pageCount;
  
  useEffect(() => {
    if(pageData && firstPage !== pageData.results) {
      setTimeout(() => window.scrollTo({ behavior: "auto", top: 0 }), 100);
      pagesDispatch({ reset: true, posts: pageData.results.posts });
      setFirstPage(pageData.results);
      if(fetchCancel) fetchCancel();
      curPage.current = typeof search.page === "string" && parseInt(search.page) || 0;
    }
  }, [firstPage, pageData, search.page, fetchCancel]);
  
  useEffect(() => {
    if(pagination && pages.length > 1) pagesDispatch({ reset: true, posts: pages[0] });
    if(!pagination && search.page !== undefined) {
      curPage.current = typeof search.page === "string" && parseInt(search.page) || 0;
      history.replace(`?${qs.stringify({ ...search, page: undefined })}`);
    }
  }, [history, pages, pagination, search]);
  
  useEffect(() => {
    if(usePagination) return;
    if(end) return;
    if(fetchCancel) return;
    
    const checkScroll = async () => {
      const body = document.body;
      const html = document.documentElement;
      const bottomPosition = window.pageYOffset + window.innerHeight;
      const bodyHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
      
      if(bodyHeight - bottomPosition < window.innerHeight * 0.25) {
        curPage.current++;
        
        try {
          const result = await requestJSON<PostsSearchResponse, PostsSearchRequest>({
            pathname: "/api/post",
            search: {
              query,
              page: curPage.current,
            },
            cancelCb: cancel => setFetchCancel(() => cancel),
          });
          
          pagesDispatch({ posts: result.posts });
          setFetchCancel(null);
        } catch(e) {
          if(!(e instanceof axios.Cancel)) throw e;
        }
      }
    };
    
    checkScroll();
    document.addEventListener("scroll", checkScroll);
    return () => document.removeEventListener("scroll", checkScroll);
  }, [end, query, usePagination, pages, fetchCancel]);
  
  return (
    <Layout className="SearchPage" options
            extraLink={pageData?.results.total && <div className="total">Results: {pageData.results.total}</div>}
            sidebar={firstPage.tags && <Tags tags={firstPage.tags} searchMod />}>
      <div className="posts">
        {pages.flatMap(posts => posts.map(post => <Thumbnail key={post.id} post={post} />))}
        {new Array(20).fill(null).map((v, id) => <div key={id} className="placeholder" />)}
      </div>
      {end && !usePagination && pages.length > 0 && pages[0].length > 0 &&
        <div className="end" />
      }
      {fetchCancel && <Spinner />}
      {pages[0]?.length === 0 &&
        <div className="empty">No Posts Found</div>
      }
      {usePagination
        ? <Pagination count={pageCount} />
        : <div className="bottomPad" />
      }
    </Layout>
  );
}
