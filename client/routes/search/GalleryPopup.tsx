import React, { useCallback, useEffect, useReducer, useRef } from "react";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import { PostSummary } from "../../../server/routes/apiTypes";
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
  const offset = useRef(0);
  const velocity = useRef(0);
  const moving = useRef(false);
  const position = useRef(new Map<number, [number, number]>());
  const lastMove = useRef(Date.now());
  const wrapper = useRef<HTMLDivElement>(null);
  
  const onClick = useCallback<React.MouseEventHandler>(ev => {
    ev.preventDefault();
    
    if(Math.abs(offset.current) < 1) {
      const target = ev.currentTarget;
      let outside = false;
      
      if(target instanceof HTMLImageElement) {
        let boundsX = target.naturalWidth;
        let boundsY = target.naturalHeight;
        
        if(boundsX > target.width) {
          boundsY = boundsY * (target.width / boundsX);
          boundsX = target.width;
        }
        
        if(boundsY > target.height) {
          boundsX = boundsX * (target.height / boundsY);
          boundsY = target.height;
        }
        
        if((target.width - boundsX) / 2 > ev.clientX) outside = true;
        if((target.width + boundsX) / 2 < ev.clientX) outside = true;
        if((target.height - boundsY) / 2 > ev.clientY) outside = true;
        if((target.height + boundsY) / 2 < ev.clientY) outside = true;
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
      if(ev.key === "ArrowLeft") velocity.current = 10;
      else if(ev.key === "ArrowRight") velocity.current = -10;
      else if(ev.key === "Escape") setId(null);
    };
    
    document.documentElement.addEventListener("keydown", onKeyDown);
    return () => document.documentElement.removeEventListener("keydown", onKeyDown);
  }, [history, id, setId]);
  
  if(id === null || !posts[id]) return null;
  
  const leftPost = hasLeft ? posts[id - 1] : null;
  const post = posts[id];
  const rightPost = hasRight ? posts[id + 1] : null;
  
  return (
    <div className="GalleryPopup" style={{ left: `${offset.current}vw` }} ref={wrapper}>
      <div className={`header${header ? " open" : ""}`}>
        <div className="closeBtn" onClick={onClose}>✕</div>
        <Link to={`/posts/${post.id}`} className="moreBtn">Open Post</Link>
      </div>
      {leftPost && <File key={leftPost.id} post={leftPost} className="left" draggable={false} controls={false} muted />}
      <File key={post.id} post={post} onClick={onClick} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerMove={onPointerMove} draggable={false} controls={false} autoPlay />
      {rightPost && <File key={rightPost.id} post={rightPost} className="right" draggable={false} controls={false} muted />}
    </div>
  );
}
