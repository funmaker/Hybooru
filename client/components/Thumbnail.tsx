import React, { useReducer } from "react";
import { Link } from "react-router-dom";
import { PostSummary } from "../../server/routes/apiTypes";
import { EM_SIZE } from "../App";
import useSSR from "../hooks/useSSR";
import useConfig from "../hooks/useConfig";
import useSearch from "../hooks/useSearch";
import { thumbnailUrl } from "../../server/helpers/consts";
import "./Thumbnail.scss";

export interface ThumbnailProps {
  post: PostSummary;
  noFade?: boolean;
}

export default function Thumbnail({ post, noFade }: ThumbnailProps) {
  const SSR = useSSR();
  const config = useConfig();
  const search = useSearch();
  const [dynamic, setLoaded] = useReducer(() => false, !SSR && !noFade);
  const query = (typeof search.query === "string" && search.query) ? `?query=${encodeURIComponent(search.query)}` : "";
  
  return (
    <Link className={`Thumbnail${dynamic ? " dynamic" : ""}`} to={`/posts/${post.id}${query}`}>
      <img src={thumbnailUrl(post)} alt={String(post.id)}
           style={{
             width: config.thumbnailSize[0] / EM_SIZE + "em",
             height: config.thumbnailSize[1] / EM_SIZE + "em",
           }}
           onLoad={setLoaded} onError={setLoaded} />
    </Link>
  );
}

