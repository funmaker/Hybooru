import React, { InputHTMLAttributes, useCallback, useRef, useState } from "react";
import { Canceler } from "axios";
import { TagsSearchRequest, TagsSearchResponse, TagsSearchResults } from "../../server/routes/apiTypes";
import { namespaceRegex } from "../../server/helpers/consts";
import useConfig from "../hooks/useConfig";
import requestJSON from "../helpers/requestJSON";
import useLocalStorage from "../hooks/useLocalStorage";
import { useRTQuery } from "../hooks/useQuery";
import "./TagInput.scss";

const DEBOUNCE_FREQ = 1000;
const TAGS_COUNT = 10;

export default function TagInput({ ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  const [showNamespace] = useLocalStorage("namespaces", false);
  const [tags, setTags] = useState<Record<string, number> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const tagsRef = useRef<HTMLDivElement | null>(null);
  const box = inputRef.current?.getBoundingClientRect();
  const timeoutRef = useRef<NodeJS.Timeout | number | null>(null);
  const blurRef = useRef<NodeJS.Timeout | number | null>(null);
  const requestRef = useRef<Canceler | null>(null);
  
  const [query, setQuery] = useRTQuery();
  const queryRef = useRef(query);
  queryRef.current = query;
  
  const stop = useCallback(() => {
    if(timeoutRef.current) {
      clearTimeout(timeoutRef.current as any);
      timeoutRef.current = null;
    }
    if(requestRef.current) {
      requestRef.current();
      requestRef.current = null;
    }
  }, []);
  
  const reset = useCallback(() => {
    stop();
    
    timeoutRef.current = setTimeout(async () => {
      timeoutRef.current = null;
      
      let query = queryRef.current.split(" ").slice(-1)[0];
      if(query.startsWith("-")) query = query.slice(1);
      query = `*${query}*`;
      
      const result = await requestJSON<TagsSearchResults, TagsSearchRequest>({
        pathname: "/api/tags",
        search: {
          pageSize: TAGS_COUNT,
          query,
        },
        cancelCb: cancel => requestRef.current = cancel,
      });
      
      setTags(result.tags);
    }, DEBOUNCE_FREQ);
  }, [stop]);
  
  const onFocus = useCallback(() => {
    reset();
    if(blurRef.current) clearTimeout(blurRef.current as any);
  }, [reset]);
  
  const onBlur = useCallback(() => {
    blurRef.current = setTimeout(() => {
      blurRef.current = null;
      setTags(null);
      stop();
    }, 100);
  }, [stop]);
  
  const onInputChange = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
    reset();
    setQuery(ev.target.value, true);
  }, [reset, setQuery]);
  
  const onRowClick = useCallback((tag: string) => {
    setQuery(query => {
      inputRef.current?.focus();
      
      const parts = query.split(" ");
      if(parts[parts.length - 1].startsWith("-")) tag = `-${tag}`;
      parts[parts.length - 1] = tag;
      return parts.join(" ") + " ";
    }, true);
  }, [setQuery]);
  
  const onKeyPress = useCallback((ev: React.KeyboardEvent<HTMLInputElement>) => {
    if(ev.key === "Enter") {
      ev.currentTarget.blur();
    }
  }, []);
  
  const onKeyDown = useCallback((ev: React.KeyboardEvent<HTMLInputElement>) => {
    if(ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      
      const targets = [inputRef.current, ...Array.from(tagsRef.current?.children || [])] as Array<(null | HTMLAnchorElement | HTMLInputElement)>;
      const cur = targets.indexOf(document.activeElement as any);
      if(cur < 0) return;
      
      const dir = ev.key === "ArrowDown" ? 1 : -1;
      targets[cur + dir]?.focus();
    }
  }, []);
  
  return (
    <span className="TagInput" onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown}>
      <input value={query} {...rest} ref={inputRef}
             autoComplete="off" autoCorrect="off"
             onChange={onInputChange} onKeyPress={onKeyPress} />
      {tags && box &&
        <div className="tags" ref={tagsRef}
             style={{
               left: `${box.x - 1}px`,
               top: `${box.y + box.height - 1}px`,
               width: `${box.width + 2}px`,
             }}>
          {Object.entries(tags).map(([tag, posts]) => <Row key={tag} tag={tag} posts={posts} onClick={onRowClick} showNamespace={showNamespace} />)}
        </div>
      }
    </span>
  );
}

interface RowProps {
  tag: string;
  posts: number;
  onClick: (s: string) => void;
  showNamespace?: boolean;
}

function Row({ tag, posts, onClick, showNamespace }: RowProps) {
  const config = useConfig();
  
  let name = tag.replace(/_/g, " ");
  let color: string | undefined;
  
  const result = name.match(namespaceRegex);
  if(result) {
    if(!showNamespace) name = result[2];
    color = config.namespaceColors[result[1]];
  }
  
  const onRowClick = useCallback((ev: React.MouseEvent<HTMLAnchorElement>) => {
    ev.preventDefault();
    onClick(tag);
  }, [onClick, tag]);
  
  const onKeyPress = useCallback((ev: React.KeyboardEvent<HTMLAnchorElement>) => {
    if(ev.key === "Enter") {
      ev.preventDefault();
      onClick(tag);
    }
  }, [onClick, tag]);
  
  return (
    <a href="#" className="row" onClick={onRowClick} onKeyPress={onKeyPress}>
      <span className="name" style={{ color }}>{name}</span>
      <span className="posts">{posts}</span>
    </a>
  );
}
