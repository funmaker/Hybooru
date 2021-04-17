import React, { useCallback, useEffect, useReducer, useState } from "react";
import { Link } from "react-router-dom";
import { RegenDBRequest } from "../../server/routes/apiTypes";
import requestJSON from "../helpers/requestJSON";
import ReactForm from "../components/ReactForm";
import useMeasure from "../hooks/useMeasure";
import useLocalStorage from "../hooks/useLocalStorage";
import useChange from "../hooks/useChange";
import usePageData from "../hooks/usePageData";
import useConfig from "../hooks/useConfig";
import useQuery from "../hooks/useQuery";
import useCSRF from "../hooks/useCSRF";
import TagInput from "./TagInput";
import SSRCurtain from "./SSRCurtain";
import ThemeSwitch from "./ThemeSwitch";
import "./Layout.scss";

export interface LayoutProps {
  className?: string;
  sidebar?: React.ReactNode;
  children?: React.ReactNode;
  extraLink?: React.ReactNode;
  searchAction?: string;
  options?: boolean;
  dimmed?: boolean;
}

export default function Layout({ className, sidebar, children, extraLink, searchAction = "/posts", options, dimmed }: LayoutProps) {
  const config = useConfig();
  const { ref, rect } = useMeasure();
  const [, fetching] = usePageData(false);
  const [optionsOpen, toggleOptions] = useReducer(s => !s, false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const csrf = useCSRF();
  const urlQuery = useQuery();
  const [query, setQuery] = useState(urlQuery);
  const mobile = rect?.width && rect.width < 1000;
  
  const onQueryChange = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => setQuery(ev.target.value), []);
  
  useChange(urlQuery, newQuery => {
    if(newQuery !== query) setQuery(newQuery);
  });
  
  const [pagination, setPagination] = useLocalStorage("pagination", false);
  const [popup, setPopup] = useLocalStorage("popup", false);
  const [namespaces, setNamespaces] = useLocalStorage("namespaces", false);
  const [fullHeight, setFullHeight] = useLocalStorage("fullHeight", false);
  const togglePagination = useCallback((ev: React.MouseEvent) => { ev.preventDefault(); setPagination(!pagination); }, [pagination, setPagination]);
  const togglePopup = useCallback((ev: React.MouseEvent) => { ev.preventDefault(); setPopup(!popup); }, [popup, setPopup]);
  const toggleNamespaces = useCallback((ev: React.MouseEvent) => { ev.preventDefault(); setNamespaces(!namespaces); }, [namespaces, setNamespaces]);
  const toggleFullHeight = useCallback((ev: React.MouseEvent) => { ev.preventDefault(); setFullHeight(!fullHeight); }, [fullHeight, setFullHeight]);
  
  const regenDB = useCallback(async (ev: React.MouseEvent) => {
    ev.preventDefault();
    const password = prompt("Password");
    
    if(password !== null) {
      await requestJSON<null, RegenDBRequest>({
        pathname: "/api/regenDB",
        method: "POST",
        data: { password, _csrf: csrf },
      });
    }
  }, [csrf]);
  
  const onSort = useCallback((ev: React.ChangeEvent<HTMLSelectElement>) => {
    setQuery(query => {
      const newQuery = query.trimRight()
                            .split(" ")
                            .filter(s => !s.startsWith("order:"))
                            .join(" ");
      
      return newQuery + ` order:${ev.target.value}`;
    });
  }, []);
  
  const onSidebarButtonClick = useCallback((ev: React.MouseEvent) => {
    ev.preventDefault();
    openSidebar();
  }, [openSidebar]);
  
  const onOptionsButtonClick = useCallback((ev: React.MouseEvent) => {
    ev.preventDefault();
    toggleOptions();
  }, []);
  
  let domClassName = "Layout";
  if(mobile) domClassName += ` mobile`;
  if(className) domClassName += ` ${className}`;
  
  let dimmerActive = dimmed || false;
  if(mobile && sidebarOpen) dimmerActive = true;
  
  useEffect(() => {
    if(!dimmerActive) return;
    
    document.documentElement.classList.add("dimmed");
    return () => document.documentElement.classList.remove("dimmed");
  }, [dimmerActive]);
  
  return (
    <div className={domClassName} ref={ref}>
      <div className={`sidebar${sidebarOpen ? " open" : ""}${sidebar ? "" : " simple"}`}>
        <div className="logo">
          <Link to="/">{config.appName}</Link>
        </div>
        <div className="sidebarContent">
          {sidebar}
        </div>
      </div>
      <div className="header">
        {mobile &&
          <a href="#" className="menuButton" onClick={onSidebarButtonClick}><img src="/static/menu_icon.svg" alt="menu" /></a>
        }
        <div className="links">
          <Link to="/">Main Page</Link>
          <Link to="/posts">All Posts</Link>
          <Link to="/tags">Tags</Link>
          <a href="/random">Random</a>
          <a href="https://github.com/funmaker/hybooru" target="_blank" rel="noreferrer">GitHub</a>
          <ThemeSwitch />
          {extraLink}
        </div>
        <ReactForm className="search" action={searchAction}>
          <TagInput name="query" placeholder="Search: flower sky 1girl" value={query} onChange={onQueryChange} onValueChange={setQuery} />
          <SSRCurtain>{options && <a className="settingsButton" href="#" onClick={onOptionsButtonClick}><img src="/static/cog.svg" alt="settings" /></a>}</SSRCurtain>
          <button>Search</button>
        </ReactForm>
        {fetching && <div className="progress" />}
        {optionsOpen &&
          <div className="menu">
            <div>
              <select value="label" onChange={onSort}>
                <option value="label" disabled>Sorting</option>
                <option value="date">Date Imported (Newest First)</option>
                <option value="date_asc">Date Imported (Oldest First)</option>
                <option value="score">Score (Descending)</option>
                <option value="score_asc">Score (Ascending)</option>
                <option value="size">File Size (Descending)</option>
                <option value="size_asc">File Size (Ascending)</option>
                <option value="id">Id</option>
              </select>
            </div>
            <div><a href="#" onClick={togglePagination}>Auto Paging: {!pagination ? "Yes" : "No"}</a></div>
            <div><a href="#" onClick={togglePopup}>Popup Gallery: {popup ? "Yes" : "No"}</a></div>
            <div><a href="#" onClick={toggleNamespaces}>Hide Namespaces: {namespaces ? "No" : "Yes"}</a></div>
            <div><a href="#" onClick={toggleFullHeight}>Limit Img Height: {fullHeight ? "No" : "Yes"}</a></div>
            <hr />
            <div><a href="#" onClick={regenDB}>Rebuild Database</a></div>
          </div>
        }
      </div>
      <div className={`contentDimmer${dimmerActive ? " active" : ""}`} onClick={closeSidebar} />
      <div className="content">
        {children}
      </div>
    </div>
  );
}
