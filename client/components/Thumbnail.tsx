import React, { useReducer } from "react";
import { Link } from "react-router-dom";
import { PostSummary } from "../../server/routes/apiTypes";
import useSSR from "../helpers/useSSR";
import "./Thumbnail.scss";

export interface ThumbnailProps {
  post: PostSummary;
}

export default function Thumbnail({ post }: ThumbnailProps) {
  const SSR = useSSR();
  const [dynamic, setLoaded] = useReducer(() => false, !SSR);
  
  return (
    <Link className={`Thumbnail${dynamic ? " dynamic" : ""}`} to={`/posts/${post.id}`}>
      <img src={`/files/t${post.hash}.thumbnail`} alt={String(post.id)} onLoad={setLoaded} onError={setLoaded} />
    </Link>
  );
}

