import React, { useCallback, useReducer } from "react";
import { Link } from "react-router-dom";
import { PostSummary } from "../../server/routes/apiTypes";
import { EM_SIZE } from "../App";
import useSSR from "../hooks/useSSR";
import useConfig from "../hooks/useConfig";
import useSearch from "../hooks/useSearch";
import { thumbnailUrl } from "../../server/helpers/consts";
import "./Thumbnail.scss";

export interface ThumbnailProps {
  id: number;
  post: PostSummary;
  noFade?: boolean;
  onClick: (ev: React.MouseEvent<HTMLAnchorElement>, post: number) => void;
  useId?: boolean;
}

export default function Thumbnail({ id, post, noFade, onClick, useId }: ThumbnailProps) {
  const SSR = useSSR();
  const config = useConfig();
  const search = useSearch();
  const [dynamic, setLoaded] = useReducer(() => false, !SSR && !noFade);
  const query = (typeof search.query === "string" && search.query) ? `?query=${encodeURIComponent(search.query)}` : "";
  
  const onClickLink = useCallback((ev: React.MouseEvent<HTMLAnchorElement>) => {
    if(onClick) onClick(ev, id);
  }, [onClick, id]);
  
  return (
    <Link className={`Thumbnail${dynamic ? " dynamic" : ""}`} to={`/posts/${post.id}${query}`} onClick={onClickLink}>
      <img src={thumbnailUrl(post)} alt={String(post.id)}
           id={useId ? post.id.toString() : undefined}
           style={{
             width: config.thumbnailSize[0] / EM_SIZE + "em",
             height: config.thumbnailSize[1] / EM_SIZE + "em",
           }}
           onLoad={setLoaded} onError={setLoaded} />
    </Link>
  );
}

