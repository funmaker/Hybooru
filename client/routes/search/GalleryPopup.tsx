import React, { useCallback, useEffect, useReducer, useRef } from "react";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import { PostSummary } from "../../../server/routes/apiTypes";
import useQuery from "../../hooks/useQuery";
import File from "../post/File";
import "./GalleryPopup.scss";

interface GalleryPopupProps {
  posts: PostSummary[];
  id: number | null;
  setId: (id: number | null) => void;
}

export default function GalleryPopup({ posts, id, setId }: GalleryPopupProps) {
  const [header, toggleHeader] = useReducer(acc => !acc, true);
  const history = useHistory();
  let [query] = useQuery();
  query = query && `?query=${encodeURIComponent(query)}`;
  const offset = useRef(0);
  const velocity = useRef(0);
  const moving = useRef(false);
  const position = useRef(new Map<number, [number, number]>());
  const lastMove = useRef(Date.now());
  const wrapper = useRef<HTMLDivElement>(null);
  
  const onBackgroundClick = useCallback<React.MouseEventHandler>(ev => {
    ev.stopPropagation();
    ev.preventDefault();
    
    if(Math.abs(offset.current) < 1) {
      setId(null);
    }
  }, [setId]);
  
  const onClick = useCallback<React.MouseEventHandler>(ev => {
    ev.stopPropagation();
    ev.preventDefault();
    
    if(Math.abs(offset.current) < 1) {
      const target = ev.currentTarget;
      let outside = false;
      
      if(target instanceof HTMLImageElement) {
        let boundsX = target.naturalWidth || target.width;
        let boundsY = target.naturalHeight || target.height;
        const bbox = target.getBoundingClientRect();
        
        if(boundsX > bbox.width) {
          boundsY *= (bbox.width / boundsX);
          boundsX = bbox.width;
        }
        
        if(boundsY > bbox.height) {
          boundsX *= (bbox.height / boundsY);
          boundsY = bbox.height;
        }
        
        if((target.width - boundsX) / 2 > ev.clientX - bbox.x) outside = true;
        if((target.width + boundsX) / 2 < ev.clientX - bbox.x) outside = true;
        if((target.height - boundsY) / 2 > ev.clientY - bbox.y) outside = true;
        if((target.height + boundsY) / 2 < ev.clientY - bbox.y) outside = true;
      }
      
      if(outside) setId(null);
      else toggleHeader();
    }
  }, [setId]);
  
  const onPointerDown = useCallback<React.PointerEventHandler>(ev => {
    if(moving.current) return;
    ev.currentTarget.setPointerCapture(ev.pointerId);
    moving.current = true;
    position.current.set(ev.pointerId, [ev.clientX, ev.clientY]);
  }, []);
  
  const onPointerUp = useCallback<React.PointerEventHandler>(ev => {
    ev.currentTarget.releasePointerCapture(ev.pointerId);
    moving.current = false;
  }, []);
  
  const onPointerMove = useCallback<React.PointerEventHandler>(ev => {
    if(!moving.current) return;
    const lastPos = position.current.get(ev.pointerId)!;
    const movementX = ev.clientX - lastPos[0];
    
    velocity.current = (movementX / window.innerWidth * 100) / (Date.now() - lastMove.current);
    offset.current += movementX / window.innerWidth * 100;
    lastMove.current = Date.now();
    position.current.set(ev.pointerId, [ev.clientX, ev.clientY]);
  }, []);
  
  const onClose = useCallback(() => setId(null), [setId]);
  
  const hasLeft = id !== null && id - 1 >= 0;
  const hasRight = id !== null && id + 1 < posts.length;
  
  useEffect(() => {
    if(id === null) return;
    let requestId: number;
    
    const onUpdate = () => {
      requestId = requestAnimationFrame(onUpdate);
      if(!wrapper.current) return;
      
      if(!moving.current) {
        const intent = offset.current / 10 + velocity.current * 10;
        
        if(intent < -1 && hasRight) offset.current = Math.max(-100, offset.current - Math.max(5, (100 + offset.current) / 5));
        else if(intent > 1 && hasLeft) offset.current = Math.min(100, offset.current + Math.max(5, (100 - offset.current) / 5));
        else if(offset.current < 0) offset.current = Math.min(0, offset.current + Math.max(1, -offset.current / 10));
        else if(offset.current > 0) offset.current = Math.max(0, offset.current - Math.max(1, offset.current / 10));
        
        if((offset.current >= 100 && hasLeft) || (offset.current <= -100 && hasRight)) {
          setId(id - Math.sign(offset.current));
          offset.current = 0;
          velocity.current = 0;
        }
      }
      
      wrapper.current.style.left = `${offset.current}vw`;
    };
    
    requestId = requestAnimationFrame(onUpdate);
    return () => cancelAnimationFrame(requestId);
  }, [hasLeft, hasRight, id, setId]);
  
  useEffect(() => {
    if(id === null) return;
    
    const onKeyDown = (ev: KeyboardEvent) => {
      if(ev.key === "ArrowLeft" && hasLeft) setId(id - 1);
      else if(ev.key === "ArrowRight" && hasRight) setId(id + 1);
      else if(ev.key === "Enter") history.push(`/posts/${posts[id].id}${query}`);
      else if(ev.key === "Escape") setId(null);
    };
    
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      if(ev.deltaY < 0 && hasLeft) setId(id - 1);
      else if(ev.deltaY > 0 && hasRight) setId(id + 1);
    };
    
    document.documentElement.addEventListener("keydown", onKeyDown);
    document.documentElement.addEventListener("wheel", onWheel);
    return () => {
      document.documentElement.removeEventListener("keydown", onKeyDown);
      document.documentElement.removeEventListener("wheel", onWheel);
    };
  }, [history, posts, id, setId, hasLeft, hasRight, query]);
  
  if(id === null || !posts[id]) return null;
  
  const leftPost = hasLeft ? posts[id - 1] : null;
  const post = posts[id];
  const rightPost = hasRight ? posts[id + 1] : null;
  
  return (
    <div className="GalleryPopup" style={{ left: `${offset.current}vw` }} ref={wrapper}>
      <div className={`header${header ? " open" : ""}`}>
        <div className="closeBtn" onClick={onClose}>✕</div>
        <Link to={`/posts/${post.id}${query}`} className="moreBtn">Open Post</Link>
      </div>
      {leftPost &&
        <div key={leftPost.id} className="wrap left">
          <File post={leftPost} draggable={false} controls={false} paused />
        </div>
      }
      {/* eslint-disable-next-line react/no-unknown-property */} { /* TODO: WHY? */ }
      <div key={post.id} className="wrap" onClick={onBackgroundClick} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerMove={onPointerMove} >
        <File post={post} draggable={false} controls={false} onClickCapture={onClick} autoPlay />
      </div>
      {rightPost &&
        <div key={rightPost.id} className="wrap right">
          <File post={rightPost} draggable={false} controls={false} paused />
        </div>
      }
    </div>
  );
}
