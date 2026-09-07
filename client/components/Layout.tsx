import React, { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { trimQuery } from "../helpers/utils";
import ReactForm from "../components/ReactForm";
import useMeasure from "../hooks/useMeasure";
import usePageData from "../hooks/usePageData";
import ErrorPage from "../routes/error/ErrorPage";
import TagInput from "./TagInput";
import SSRCurtain from "./SSRCurtain";
import ThemeSwitch from "./ThemeSwitch";
import SettingsMenu from "./SettingsMenu";
import Logo from "./Logo";
import "./Layout.scss";

const stopPropagation = (ev: React.SyntheticEvent) => ev.stopPropagation();

export interface LayoutProps {
  className?: string;
  sidebar?: React.ReactNode;
  children?: React.ReactNode;
  extraLink?: React.ReactNode;
  searchAction?: string;
  random?: boolean;
  simpleSettings?: boolean;
  dimmed?: boolean;
  plain?: boolean;
  noError?: boolean;
}

export default function Layout({ className, sidebar, children, extraLink, searchAction = "/posts", random = true, simpleSettings = false, dimmed = false, plain = false, noError = false }: LayoutProps) {
  const { ref, rect } = useMeasure();
  const { pageError, fetching } = usePageData(false);
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
  if(plain) domClassName += ` plain`;
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
    let done = false;
    const onDocumentClick = () => setSettingsOpen(false);
    
    setTimeout(() => {
      if(!done) document.addEventListener("click", onDocumentClick);
    }, 0);
    
    return () => {
      done = true;
      document.removeEventListener("click", onDocumentClick);
    };
  }, [settingsOpen]);
  
  if(pageError && !noError) return <ErrorPage error={pageError} />;
  
  if(plain) {
    return (
      <div className={domClassName}>
        {fetching && <div className="layoutProgress" />}
        {children}
      </div>
    );
  }
  
  return (
    <div className={domClassName} ref={ref}>
      <div className={`sidebar${sidebarOpen ? " open" : ""}${sidebar ? "" : " simple"}`}>
        <Logo />
        <div className="sidebarContent">{sidebar}</div>
      </div>
      <div className="header">
        {mobile && <a href="#" className="menuButton" onClick={onSidebarButtonClick}><img src="/static/menu_icon.svg" alt="menu" /></a>}
        <div className="links">
          <Link to="/">Main Page</Link>
          <Link to="/posts">All Posts</Link>
          <Link to="/tags">Tags</Link>
          <Link to="/random" rel="nofollow">Random</Link>
          <a href="https://github.com/funmaker/hybooru" target="_blank" rel="noreferrer">GitHub</a>
          <ThemeSwitch />
          {extraLink}
        </div>
        <ReactForm className="search" action={searchAction} processFormData={trimQuery}>
          <TagInput name="query" placeholder="Search: flower sky 1girl" />
          <SSRCurtain><a className="settingsButton" href="#" onClick={onOptionsButtonClick}><img src="/static/cog.svg" alt="settings" /></a></SSRCurtain>
          <button hidden /> {/* Capture enter-submit */}
          {random && <button formAction="/random">Random</button>}
          <button>Search</button>
        </ReactForm>
        {fetching && <div className="layoutProgress" />}
        <SettingsMenu open={settingsOpen} simpleSettings={simpleSettings} onClick={stopPropagation} />
      </div>
      <div className={`contentDimmer${dimmerActive ? " active" : ""}`} onClick={closeSidebar} />
      <div className="content">
        {children}
      </div>
    </div>
  );
}
