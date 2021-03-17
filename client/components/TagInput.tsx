import React, { InputHTMLAttributes, useCallback, useRef, useState } from "react";
import { Canceler } from "axios";
import { TagsSearchRequest, TagsSearchResponse } from "../../server/routes/apiTypes";
import useConfig from "../hooks/useConfig";
import requestJSON from "../helpers/requestJSON";
import { namespaceRegex } from "./Tags";
import "./TagInput.scss";

const DEBOUNCE_FREQ = 1000;
const TAGS_COUNT = 10;

interface TagInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
}

export default function TagInput({ value, onValueChange, ...rest }: TagInputProps) {
  const [tags, setTags] = useState<Record<string, number> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const box = inputRef.current?.getBoundingClientRect();
  const timeoutRef = useRef<NodeJS.Timeout | number | null>(null);
  const requestRef = useRef<Canceler | null>(null);
  const valueRef = useRef(typeof value === "string" ? value : "");
  
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
      const query = `*${valueRef.current.split(" ").slice(-1)[0]}*`;
      
      const result = await requestJSON<TagsSearchResponse, TagsSearchRequest>({
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
  
  const onBlur = useCallback(() => {
    setTags(null);
    stop();
  }, [stop]);
  
  const onInputChange = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
    valueRef.current = ev.target.value;
    reset();
    if(onValueChange) onValueChange(ev.target.value);
  }, [onValueChange, reset]);
  
  const onRowClick = useCallback((tag: string) => {
    console.log(tag);
    
    const parts = valueRef.current.split(" ");
    parts[parts.length - 1] = tag;
    valueRef.current = parts.join(" ") + " ";
    
    if(onValueChange) onValueChange(valueRef.current);
    else if(inputRef.current) inputRef.current.value = valueRef.current;
  }, [onValueChange]);
  
  const onKeyPress = useCallback((ev: React.KeyboardEvent<HTMLInputElement>) => {
    if(ev.key === "Enter") {
      ev.currentTarget.blur();
    }
  }, []);
  
  return <>
    <input value={value} {...rest} ref={inputRef}
           autoComplete="off" autoCorrect="off"
           onFocus={reset} onBlur={onBlur} onChange={onInputChange} onKeyPress={onKeyPress} />
    {tags && box &&
      <div className="TagInput"
           style={{
             left: `${box.x}px`,
             top: `${box.y + box.height - 1}px`,
             width: `${box.width}px`,
           }}>
        {Object.entries(tags).map(([tag, posts]) => <Row key={tag} tag={tag} posts={posts} onClick={onRowClick} />)}
      </div>
    }
  </>; // eslint-disable-line react/jsx-closing-tag-location
}

interface RowProps {
  tag: string;
  posts: number;
  onClick: (s: string) => void;
}

function Row({ tag, posts, onClick }: RowProps) {
  const config = useConfig();
  
  let name = tag.replace(/_/g, " ");
  let color: string | undefined;
  
  const result = name.match(namespaceRegex);
  if(result) {
    name = result[2];
    color = config.namespaceColors[result[1]];
  }
  
  const onRowClick = useCallback((ev: React.MouseEvent<HTMLAnchorElement>) => {
    ev.preventDefault();
    onClick(tag);
  }, [onClick, tag]);
  
  return (
    <a href="#" className="row" onMouseDown={onRowClick}>
      <span className="name" style={{ color }}>{name}</span>
      <span className="posts">{posts}</span>
    </a>
  );
}
