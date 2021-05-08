import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ReactForm from "../components/ReactForm";
import useMeasure from "../hooks/useMeasure";
import usePageData from "../hooks/usePageData";
import useConfig from "../hooks/useConfig";
import TagInput from "./TagInput";
import SSRCurtain from "./SSRCurtain";
import ThemeSwitch from "./ThemeSwitch";
import SettingsMenu from "./SettingsMenu";
import "./Layout.scss";

const stopPropagation = (ev: React.SyntheticEvent) => ev.stopPropagation();

export interface LayoutProps {
  className?: string;
  sidebar?: React.ReactNode;
  children?: React.ReactNode;
  extraLink?: React.ReactNode;
  searchAction?: string;
  simpleSettings?: boolean;
  dimmed?: boolean;
}

export default function Layout({ className, sidebar, children, extraLink, searchAction = "/posts", simpleSettings, dimmed }: LayoutProps) {
  const config = useConfig();
  const { ref, rect } = useMeasure();
  const [, fetching] = usePageData(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const mobile = rect?.width && rect.width < 1000;
  
  const onSidebarButtonClick = useCallback((ev: React.MouseEvent) => {
    ev.preventDefault();
    openSidebar();
  }, [openSidebar]);
  
  const onOptionsButtonClick = useCallback((ev: React.MouseEvent) => {
    ev.preventDefault();
    setSettingsOpen(true);
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
  
  useEffect(() => {
    if(!settingsOpen) return;
    const onDocumentClick = () => setSettingsOpen(false);
    
    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, [settingsOpen]);
  
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
          <TagInput name="query" placeholder="Search: flower sky 1girl" />
          <SSRCurtain><a className="settingsButton" href="#" onClick={onOptionsButtonClick}><img src="/static/cog.svg" alt="settings" /></a></SSRCurtain>
          <button>Search</button>
        </ReactForm>
        {fetching && <div className="progress" />}
        <SettingsMenu open={settingsOpen} simpleSettings={simpleSettings} onClick={stopPropagation} />
      </div>
      <div className={`contentDimmer${dimmerActive ? " active" : ""}`} onClick={closeSidebar} />
      <div className="content">
        {children}
      </div>
    </div>
  );
}
