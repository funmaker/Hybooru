import React from "react";
import { Link } from "react-router-dom";
import usePageData from "../../helpers/usePageData";
import { SearchPageData } from "../../../server/routes/apiTypes";
import ReactForm from "../../components/ReactForm";
import "./SearchPage.scss";

export default function SearchPage() {
  const [pageData] = usePageData<SearchPageData>();
  
  return (
    <div className="SearchPage">
      <div className="sidebar">
        <div className="header">
          <Link to="/">HyBooru</Link>
        </div>
        <div className="tags">
          {Object.entries(pageData?.results.tags || {}).map(([tag, uses]) =>
            <div key={tag}>+ - <Link to={`/posts?query=${encodeURIComponent(tag)}`}>{tag}</Link><span>{uses}</span></div>,
          )}
        </div>
      </div>
      <div className="content">
        <div className="header">
          <div className="links">
            <Link to="/">Main Page</Link>
            <Link to="/posts">All Posts</Link>
            <Link to="/tags">Tags</Link>
            <Link to="/random">Random</Link>
            <a href="https://github.com/funmaker/hybooru">GitHub</a>
          </div>
          <ReactForm className="search" action="/posts">
            <input name="query" placeholder="Search: flower sky 1girl" defaultValue={pageData?.search} />
            <button>Search</button>
          </ReactForm>
        </div>
        <div className="posts">
          {pageData?.results.posts.map(post =>
            <Link className="post" to={`/posts/${post.id}`}>
              <img key={post.id} src={`/files/t${post.hash}.thumbnail`} />
            </Link>,
          )}
        </div>
      </div>
    </div>
  );
}
