import React from 'react';
import { Link } from "react-router-dom";
import { MIME_EXT } from "../../../server/helpers/consts";
import { IndexPageData } from "../../../server/routes/apiTypes";
import usePageData from "../../hooks/usePageData";
import useConfig from "../../hooks/useConfig";
import ReactForm from "../../components/ReactForm";
import TagInput from "../../components/TagInput";
import "./IndexPage.scss";

export default function IndexPage() {
  const [pageData] = usePageData<IndexPageData>();
  const config = useConfig();
  
  const extension = pageData?.motd?.mime && MIME_EXT[pageData?.motd?.mime] || "";
  const motdLink = `/files/f${pageData?.motd?.hash}${extension}`;
  
  return (
    <div className="IndexPage">
      {pageData?.motd &&
        <a href={`/posts/${pageData.motd.id}`} className="motd">
          <img src={motdLink} alt={String(pageData.motd.id)} />
        </a>
      }
      <div className="header">
        <Link to="/posts">{config.appName}</Link>
      </div>
      <div className="links">
        <Link to="/posts">All Posts</Link>
        <Link to="/tags">Tags</Link>
        <a href="/random">Random</a>
        <a href="https://github.com/funmaker/hybooru" target="_blank" rel="noreferrer">GitHub</a>
      </div>
      <ReactForm className="search" action="/posts">
        <TagInput name="query" placeholder="Search: flower sky 1girl" />
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
        Running <a href="https://github.com/funmaker/hybooru" target="_blank" rel="noreferrer">HyBooru</a> v{config.version}<br />
        Original concept by <a href="https://danbooru.donmai.us/" target="_blank" rel="noreferrer">Danbooru</a>
      </div>
    </div>
  );
}
