import React from "react";
import { useLocation } from "react-router";
import { Link } from "react-router-dom";
import { qsParse, qsStringify } from "../helpers/utils";
import "./Pagination.scss";

interface PaginationProps {
  count: number;
}

const BUTTON_COUNT = 9;

export default function Pagination({ count }: PaginationProps) {
  const location = useLocation();
  const query = qsParse(location.search);
  const page = typeof query.page === "string" && parseInt(query.page) || 0;
  
  const buttons: React.ReactNode[] = [];
  const addButton = (target: number | null, text: React.ReactNode) => {
    let newSearch;
    if(target === null) newSearch = "#";
    else newSearch = qsStringify({ ...query, page: target });
    
    if(null === target) buttons.push(<span key={buttons.length} className="disabled">{text}</span>);
    else buttons.push(<Link key={buttons.length} to={newSearch} className={page === target ? "active" : undefined}>{text}</Link>);
  };
  
  addButton(page - 1 < 0 ? null : page - 1, "˂");
  for(let i = 0; i < BUTTON_COUNT; i++) {
    let midStart = page - Math.round(BUTTON_COUNT / 2) + 2;
    if(midStart + BUTTON_COUNT - 1 > count) midStart = count - BUTTON_COUNT + 1;
    if(midStart < 1) midStart = 1;
    
    if(i === 0) addButton(i, i + 1); // First Page
    else if(i === BUTTON_COUNT - 1 && count > 1) addButton(count - 1, count); // Last Page
    else if(i === 1 && midStart > 1) addButton(null, "..."); // Left Ellipsis
    else if(i === BUTTON_COUNT - 2 && midStart + BUTTON_COUNT - 1 < count) addButton(null, "..."); // Right Ellipsis
    else if(midStart + i < count) addButton(midStart + i - 1, midStart + i); // Middle
  }
  addButton(page + 1 >= count ? null : page + 1, "˃");
  
  return (
    <div className="Pagination">
      {buttons}
    </div>
  );
}

