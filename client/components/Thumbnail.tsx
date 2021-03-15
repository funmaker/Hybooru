import React from "react";
import { Link } from "react-router-dom";
import { PostSummary } from "../../server/routes/apiTypes";
import "./Thumbnail.scss";

export interface ThumbnailProps {
  post: PostSummary;
}

export default function Thumbnail({ post }: ThumbnailProps) {
  return (
    <Link className="Thumbnail" to={`/posts/${post.id}`}>
      <img src={`/files/t${post.hash}.thumbnail`} alt={String(post.id)} />
    </Link>
  );
}

