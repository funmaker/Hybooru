import React, { useReducer } from "react";
import { Link } from "react-router-dom";
import ReactForm from "../components/ReactForm";
import useMeasure from "../helpers/useMeasure";
import "./Layout.scss";

export interface LayoutProps {
  className?: string;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}

export default function Layout({ className, sidebar, children }: LayoutProps) {
  const { ref, rect } = useMeasure();
  const [sidebarOpen, toggleSidebar] = useReducer(s => !s, false);
  const mobile = rect?.width && rect.width < 1000;
  
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
          <input name="query" placeholder="Search: flower sky 1girl" />
          <button>Search</button>
        </ReactForm>
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
