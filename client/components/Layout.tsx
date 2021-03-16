import React, { useCallback, useReducer, useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router";
import qs from "query-string";
import ReactForm from "../components/ReactForm";
import useMeasure from "../helpers/useMeasure";
import useLocalStorage from "../helpers/useLocalStorage";
import useChange from "../helpers/useChange";
import usePageData from "../helpers/usePageData";
import "./Layout.scss";

export interface LayoutProps {
  className?: string;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}

export default function Layout({ className, sidebar, children }: LayoutProps) {
  const { ref, rect } = useMeasure();
  const [, fetching] = usePageData(false);
  const [menuOpen, toggleMenu] = useReducer(s => !s, false);
  const [sidebarOpen, toggleSidebar] = useReducer(s => !s, false);
  const [pagination, setPagination] = useLocalStorage("pagination", false);
  const search = qs.parse(useLocation().search);
  const urlQuery = typeof search.query === "string" ? search.query : "";
  const [query, setQuery] = useState(urlQuery);
  const mobile = rect?.width && rect.width < 1000;
  
  const onQueryChange = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => setQuery(ev.target.value), []);
  
  useChange(urlQuery, newQuery => {
    if(newQuery !== query) setQuery(newQuery);
  });
  
  const togglePagination = useCallback((ev: React.MouseEvent) => {
    ev.preventDefault();
    setPagination(!pagination);
  }, [pagination, setPagination]);
  
  let domClassName = "Layout";
  if(mobile) domClassName += ` mobile`;
  if(className) domClassName += ` ${className}`;
  
  return (
    <div className={domClassName} ref={ref}>
      <div className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="logo">
          <Link to="/">HyBooru</Link>
        </div>
        <div className="sidebarContent">
          {sidebar}
        </div>
      </div>
      <div className="header">
        {mobile &&
          <img src="/static/menu_icon.svg" alt="menu" className="menuButton" onClick={toggleSidebar} />
        }
        <div className="links">
          <Link to="/">Main Page</Link>
          <Link to="/posts">All Posts</Link>
          <Link to="/tags">Tags</Link>
          <Link to="/random">Random</Link>
          <a href="https://github.com/funmaker/hybooru">GitHub</a>
        </div>
        <ReactForm className="search" action="/posts">
          <input name="query" placeholder="Search: flower sky 1girl" value={query} onChange={onQueryChange} />
          <img src="/static/cog.svg" alt="settings" className="settingsButton" onClick={toggleMenu} />
          <button>Search</button>
        </ReactForm>
        <div className={`progress${fetching ? " active" : ""}`} />
        {menuOpen &&
          <div className="menu">
            <a href="#" onClick={togglePagination}>Auto Paging: {pagination ? "No" : "Yes"}</a>
          </div>
        }
      </div>
      {mobile &&
        <div className="contentDimmer" onClick={toggleSidebar} />
      }
      <div className="content">
        {children}
      </div>
    </div>
  );
}
