import React, { useState } from 'react';
import { Link } from "wouter";
import { IndexPageResponse } from "../../../types/api";
import { trimQuery } from "../../helpers/utils";
import usePageData from "../../hooks/usePageData";
import useConfig from "../../hooks/useConfig";
import ReactForm from "../../components/ReactForm";
import TagInput from "../../components/TagInput";
import ThemeSwitch from "../../components/ThemeSwitch";
import Logo from "../../components/Logo";
import Layout from "../../components/Layout";
import File from "../post/File";
import useTheme from "../../hooks/useTheme";
import useChange from "../../hooks/useChange";
import "./IndexPage.scss";

export default function IndexPage() {
  const { pageData, refresh } = usePageData<IndexPageResponse>();
  const [config] = useConfig();
  const [theme] = useTheme();
  const [showMotd, setShowMotd] = useState(true);
  
  useChange(theme, () => {
    setShowMotd(false);
    refresh().catch(console.error);
  });
  
  useChange(pageData, () => {
    setShowMotd(true);
  });
  
  return (
    <Layout className="IndexPage" plain>
      {config.expectMotd && (
        <div className="motdWrap">
          {showMotd && pageData?.motd && (
            <File post={pageData.motd} link={`/posts/${pageData.motd.id}`} controls={false} muted />
          )}
        </div>
      )}
      <div className="header">
        <Logo to="/posts" />
      </div>
      <div className="links">
        <Link to="/posts">All Posts</Link>
        <Link to="/tags">Tags</Link>
        <Link to="/random">Random</Link>
        <a href="https://github.com/funmaker/hybooru" target="_blank" rel="noreferrer">GitHub</a>
        <ThemeSwitch />
      </div>
      <ReactForm className="search" action="/posts" processFormData={trimQuery}>
        <TagInput name="query" placeholder="Search: flower sky 1girl" />
        <button>Search</button>
      </ReactForm>
      {pageData && (
        <div className="stats">
          <div>Posts: <span>{pageData.stats.posts}</span></div>
          <div>Tags: <span>{pageData.stats.tags}</span></div>
          <div>Mappings: <span>{pageData.stats.mappings}</span></div>
          <div><Link to={`/posts?query=${encodeURIComponent(config.untaggedQuery)}`}>Untagged: <span>{pageData.stats.needsTags}</span></Link></div>
        </div>
      )}
      <div className="footer">
        Running <a href="https://github.com/funmaker/hybooru" target="_blank" rel="noreferrer">Hybooru</a> v{config.version}
        {pageData?.updateUrl && <a className="updateInfo" href={pageData.updateUrl} target="_blank" rel="noreferrer">(Update Avaliable)</a>} <br />
        Original concept by <a href="https://danbooru.donmai.us/" target="_blank" rel="noreferrer">Danbooru</a>
      </div>
    </Layout>
  );
}
