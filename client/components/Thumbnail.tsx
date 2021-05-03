import React, { useCallback, useEffect, useReducer, useRef } from "react";
import { Link } from "react-router-dom";
import { PostSummary } from "../../server/routes/apiTypes";
import { thumbnailUrl } from "../../server/helpers/consts";
import { EM_SIZE } from "../App";
import useSSR from "../hooks/useSSR";
import useConfig from "../hooks/useConfig";
import useQuery from "../hooks/useQuery";
import "./Thumbnail.scss";

export interface ThumbnailProps {
  id: number;
  post: PostSummary;
  noFade?: boolean;
  onClick?: (ev: React.MouseEvent<HTMLAnchorElement>, post: number) => void;
  useId?: boolean;
}

export default function Thumbnail({ id, post, noFade, onClick, useId }: ThumbnailProps) {
  const SSR = useSSR();
  const config = useConfig();
  const ref = useRef<HTMLImageElement>(null);
  const [dynamic, setLoaded] = useReducer(() => false, !SSR && !noFade);
  const [unknown, setUnknown] = useReducer(() => true, false);
  let [query] = useQuery();
  query = query && `?query=${encodeURIComponent(query)}`;
  
  const onClickLink = useCallback((ev: React.MouseEvent<HTMLAnchorElement>) => {
    if(onClick) onClick(ev, id);
  }, [onClick, id]);
  
  useEffect(() => {
    if(ref.current?.complete && ref.current.naturalWidth === 0) setUnknown();
  }, []);
  
  let url = thumbnailUrl(post);
  if(unknown) url = "/static/file.svg";
  
  return (
    <Link className={`Thumbnail${dynamic ? " dynamic" : ""}${unknown ? " unknown" : ""}`} to={`/posts/${post.id}${query}`} onClick={onClickLink} data-ext={post.extension.slice(1)}>
      <img src={url} alt={String(post.id)}
           id={useId ? post.id.toString() : undefined}
           style={{
             width: config.thumbnailSize[0] / EM_SIZE + "em",
             height: config.thumbnailSize[1] / EM_SIZE + "em",
           }}
           onLoad={setLoaded} onError={setUnknown} ref={ref} />
    </Link>
  );
}

