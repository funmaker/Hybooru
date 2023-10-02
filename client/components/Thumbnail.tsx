import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BlurhashCanvas } from "react-blurhash-async";
import { PostSummary } from "../../server/routes/apiTypes";
import { thumbnailUrl } from "../../server/helpers/consts";
import { classJoin } from "../helpers/utils";
import useLocalStorage from "../hooks/useLocalStorage";
import useSSR from "../hooks/useSSR";
import useConfig from "../hooks/useConfig";
import useQuery from "../hooks/useQuery";
import { EM_SIZE } from "../App";
import "./Thumbnail.scss";

export interface ThumbnailProps {
  id: number;
  post: PostSummary;
  noFade?: boolean;
  onClick?: (ev: React.MouseEvent<HTMLAnchorElement>, post: number) => void;
  useId?: boolean;
  label?: React.ReactNode;
}

export default function Thumbnail({ id, post, noFade, onClick, useId, label }: ThumbnailProps) {
  const SSR = useSSR();
  const config = useConfig();
  const ref = useRef<HTMLImageElement>(null);
  const [thumbnailFade] = useLocalStorage("thumbnailFade", true);
  const [blurhash] = useLocalStorage("blurhash", false);
  const [fade] = useState(thumbnailFade && !noFade && !SSR);
  const [loaded, setLoaded] = useReducer(() => true, false);
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
  
  let aspectRatio;
  if(post.width && post.height) aspectRatio = post.width / post.height;
  else aspectRatio = 1;
  
  return (
    <Link className={classJoin("Thumbnail", fade && "fade", loaded && "loaded", unknown && "unknown")} to={`/posts/${post.id}${query}`} onClick={onClickLink} data-ext={post.extension.slice(1)}>
      {!SSR && blurhash && post.blurhash && (
        <BlurhashCanvas className="Blurhash"
                        imageRef={ref}
                        hash={post.blurhash}
                        loading="eager"
                        width={32}
                        height={Math.ceil(32 / aspectRatio)} />
      )}
      <img src={url} alt={String(post.id)}
           id={useId ? post.id.toString() : undefined}
           style={{
             width: config.thumbnailSize[0] / EM_SIZE + "em",
             height: config.thumbnailSize[1] / EM_SIZE + "em",
           }}
           onLoad={setLoaded} onError={setUnknown} ref={ref} />
      {label && <label>{label}</label>}
    </Link>
  );
}

