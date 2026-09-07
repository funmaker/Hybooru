import React, { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { Link, useLocation } from "wouter";
import { PostSummary } from "../../../types/api";
import File from "../post/File";
import useQuery from "../../hooks/useQuery";
import "./GalleryPopup.scss";

interface GalleryPopupProps {
  posts: PostSummary[];
  id: number | null;
  setId: (id: number | null) => void;
}

export default function GalleryPopup({ posts, id, setId }: GalleryPopupProps) {
  const [header, toggleHeader] = useReducer(acc => !acc, true);
  const [, navigate] = useLocation();
  const { query, getUrl } = useQuery();
  const offset = useRef(0);
  const velocity = useRef(0);
  const moving = useRef(false);
  const position = useRef(new Map<number, [number, number]>());
  const lastMove = useRef(0);
  const wrapper = useRef<HTMLDivElement>(null);
  
  const [leftPost, post, rightPost] = useMemo(() => {
    const idx = posts.findIndex(post => post.id === id);
    return [
      idx > 0 ? posts[idx - 1] : null,
      (posts as Partial<PostSummary[]>)[idx] || null,
      idx < posts.length - 1 ? posts[idx + 1] : null,
    ];
  }, [id, posts]);
  
  const onClick = useCallback<React.MouseEventHandler>(ev => {
    ev.stopPropagation();
    ev.preventDefault();
    
    if(Math.abs(offset.current) < 1) {
      const target = ev.currentTarget.querySelector("img");
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
  
  useEffect(() => {
    if(!post) return;
    let requestId: number;
    
    const onUpdate = () => {
      requestId = requestAnimationFrame(onUpdate);
      if(!wrapper.current) return;
      
      if(!moving.current) {
        const intent = offset.current / 10 + velocity.current * 10;
        
        if(intent < -1 && rightPost) offset.current = Math.max(-100, offset.current - Math.max(5, (100 + offset.current) / 5));
        else if(intent > 1 && leftPost) offset.current = Math.min(100, offset.current + Math.max(5, (100 - offset.current) / 5));
        else if(offset.current < 0) offset.current = Math.min(0, offset.current + Math.max(1, -offset.current / 10));
        else if(offset.current > 0) offset.current = Math.max(0, offset.current - Math.max(1, offset.current / 10));
        
        if(offset.current >= 100 && leftPost) {
          setId(leftPost.id);
          offset.current = 0;
          velocity.current = 0;
        }
        if((offset.current <= -100 && rightPost)) {
          setId(rightPost.id);
          offset.current = 0;
          velocity.current = 0;
        }
      }
      
      wrapper.current.style.left = `${offset.current}vw`;
    };
    
    requestId = requestAnimationFrame(onUpdate);
    return () => cancelAnimationFrame(requestId);
  }, [post, leftPost, rightPost, setId]);
  
  useEffect(() => {
    if(!post) return;
    
    const onKeyDown = (ev: KeyboardEvent) => {
      if(ev.key === "ArrowLeft" && leftPost) setId(leftPost.id);
      else if(ev.key === "ArrowRight" && rightPost) setId(rightPost.id);
      else if(ev.key === "Enter") navigate(getUrl(query, `/posts/${post.id}`));
      else if(ev.key === "Escape") setId(null);
    };
    
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      if(ev.deltaY < 0 && leftPost) setId(leftPost.id);
      else if(ev.deltaY > 0 && rightPost) setId(rightPost.id);
    };
    
    document.documentElement.addEventListener("keydown", onKeyDown);
    document.documentElement.addEventListener("wheel", onWheel);
    return () => {
      document.documentElement.removeEventListener("keydown", onKeyDown);
      document.documentElement.removeEventListener("wheel", onWheel);
    };
  }, [getUrl, leftPost, navigate, post, query, rightPost, setId]);
  
  if(!post) return null;
  
  return (
    <div className="GalleryPopup" ref={wrapper}>
      <div className={`header${header ? " open" : ""}`}>
        <div className="closeBtn" onClick={onClose}>✕</div>
        <Link to={getUrl(query, `/posts/${post.id}`)} className="moreBtn">Open Post</Link>
      </div>
      {leftPost && (
        <div key={leftPost.id} className="wrap left">
          <File post={leftPost} draggable={false} controls={false} paused />
        </div>
      )}
      {/* eslint-disable-next-line react/no-unknown-property */} { /* TODO: WHY? */ }
      <div key={post.id} className="wrap" onClick={onClick} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerMove={onPointerMove}>
        <File post={post} draggable={false} controls={false} autoPlay />
      </div>
      {rightPost && (
        <div key={rightPost.id} className="wrap right">
          <File post={rightPost} draggable={false} controls={false} paused />
        </div>
      )}
    </div>
  );
}
