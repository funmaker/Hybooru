import React from 'react';
import { Link } from "react-router-dom";
import { IndexPageData } from "../../../server/routes/apiTypes";
import usePageData from "../../hooks/usePageData";
import useConfig from "../../hooks/useConfig";
import ReactForm from "../../components/ReactForm";
import "./IndexPage.scss";

export default function IndexPage() {
  const [pageData] = usePageData<IndexPageData>();
  const config = useConfig();
  
  return (
    <div className="IndexPage">
      <div className="header">
        <Link to="/posts">{config.appName}</Link>
      </div>
      <div className="links">
        <Link to="/posts">All Posts</Link>
        <Link to="/tags">Tags</Link>
        <Link to="/random">Random</Link>
        <a href="https://github.com/funmaker/hybooru">GitHub</a>
      </div>
      <ReactForm className="search" action="/posts">
        <input name="query" placeholder="Search: flower sky 1girl" />
        <button>Search</button>
      </ReactForm>
      {pageData &&
        <div className="stats">
          <div>Posts: <span>{pageData.stats.posts}</span></div>
          <div>Tags: <span>{pageData.stats.tags}</span></div>
          <div>Mappings: <span>{pageData.stats.mappings}</span></div>
          <div><Link to="/posts?query=fm:needs_tags">Untagged: <span>{pageData.stats.needsTags}</span></Link></div>
        </div>
      }
      <div className="footer">
        Original concept by <a href="https://danbooru.donmai.us/">Danbooru</a>
      </div>
    </div>
  );
}
