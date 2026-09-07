import React, { InputHTMLAttributes, useCallback, useRef, useState } from "react";
import { Canceler } from "axios";
import { TagsSearchRequest, TagsSearchResults } from "../../types/api";
import { namespaceRegex } from "../../server/helpers/consts";
import useConfig from "../hooks/useConfig";
import requestJSON from "../helpers/requestJSON";
import useLocalStorage from "../hooks/useLocalStorage";
import useQuery from "../hooks/useQuery";
import useChange from "../hooks/useChange";
import "./TagInput.scss";

const DEBOUNCE_FREQ = 1000;
const TAGS_COUNT = 10;

export default function TagInput({ ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  const [showNamespace] = useLocalStorage("namespaces", false);
  const [tags, setTags] = useState<Record<string, number> | null>(null);
  const [box, setBox] = useState<DOMRect | null>(null);
  const { query } = useQuery();
  const [value, setValue] = useState(appendSpace(query));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const tagsRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | number | null>(null);
  const blurRef = useRef<NodeJS.Timeout | number | null>(null);
  const cancelRef = useRef<Canceler | null>(null);
  
  useChange(query, query => setValue(appendSpace(query)));
  
  const reset = useCallback(() => {
    if(debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if(cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
  }, []);
  
  const tryFetch = useCallback(() => {
    reset();
    
    debounceRef.current = setTimeout(async () => {
      debounceRef.current = null;
      
      let lastPart = value.split(" ").slice(-1)[0];
      if(lastPart.startsWith("-")) lastPart = lastPart.slice(1);
      
      const result = await requestJSON<TagsSearchResults, TagsSearchRequest>({
        url: "/api/tags",
        search: {
          pageSize: TAGS_COUNT,
          query: lastPart ? `*${lastPart}*` : undefined,
        },
        cancelCb: cancel => cancelRef.current = cancel,
      });
      
      setTags(result.tags);
    }, DEBOUNCE_FREQ);
  }, [reset, value]);
  
  const onFocus = useCallback(() => {
    tryFetch();
    if(blurRef.current) clearTimeout(blurRef.current);
  }, [tryFetch]);
  
  const onBlur = useCallback(() => {
    blurRef.current = setTimeout(() => {
      blurRef.current = null;
      setTags(null);
      reset();
    }, 100);
  }, [reset]);
  
  const onInputChange = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
    tryFetch();
    setValue(ev.target.value);
  }, [tryFetch]);
  
  const onRowClick = useCallback((tag: string) => {
    setValue(query => {
      inputRef.current?.focus();
      
      const parts = query.split(" ");
      if(parts[parts.length - 1].startsWith("-")) tag = `-${tag}`;
      parts[parts.length - 1] = tag;
      return parts.join(" ") + " ";
    });
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
    if(ev.key === "Enter") {
      ev.currentTarget.blur();
    }
  }, []);
  
  const inputRefCallback = useCallback((el: HTMLInputElement | null) => {
    inputRef.current = el;
    setBox(el ? el.getBoundingClientRect() : null);
  }, []);
  
  return (
    <span className="TagInput" onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown}>
      <input value={value}
             {...rest}
             autoComplete="off" autoCorrect="off"
             onChange={onInputChange} ref={inputRefCallback} />
      {tags && box && (
        <div className="tags" ref={tagsRef}
             style={{
               left: `${box.x - 1}px`,
               top: `${box.y + box.height - 1}px`,
               width: `${box.width + 2}px`,
             }}>
          {Object.entries(tags).map(([tag, posts]) => <Row key={tag} tag={tag} posts={posts} onClick={onRowClick} showNamespace={showNamespace} />)}
        </div>
      )}
    </span>
  );
}

const appendSpace = (query: string) => query.endsWith(" ") || !query ? query : query + " ";

interface RowProps {
  tag: string;
  posts: number;
  onClick: (s: string) => void;
  showNamespace?: boolean;
}

function Row({ tag, posts, onClick, showNamespace }: RowProps) {
  const [config] = useConfig();
  
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
  
  const onKeyDown = useCallback((ev: React.KeyboardEvent<HTMLAnchorElement>) => {
    if(ev.key === "Enter") {
      ev.preventDefault();
      onClick(tag);
    }
  }, [onClick, tag]);
  
  return (
    <a href="#" className="row" onClick={onRowClick} onKeyDown={onKeyDown}>
      <span className="name" style={{ color }}>{name}</span>
      <span className="posts">{posts}</span>
    </a>
  );
}
