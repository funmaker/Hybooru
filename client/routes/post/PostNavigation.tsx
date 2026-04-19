import React, { useCallback, useEffect } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { PostNavigationResponse } from "../../../server/routes/apiTypes";
import { qsParse, qsStringify } from "../../helpers/utils";
import "./PostNavigation.scss";

interface PostNavigationProps {
  navigation: PostNavigationResponse;
}

export default function PostNavigation({ navigation }: PostNavigationProps) {
  const history = useHistory();
  const location = useLocation();
  const query = qsParse(location.search);

  const buildLink = useCallback((id: number | null) => {
    if(id === null) return null;
    return `/posts/${id}${qsStringify(query)}`;
  }, [query]);

  const prevLink = buildLink(navigation.prev);
  const nextLink = buildLink(navigation.next);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      // Don't navigate if user is typing in an input
      if(ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return;

      if(ev.key === "ArrowLeft" && prevLink) {
        ev.preventDefault();
        history.push(prevLink);
      } else if(ev.key === "ArrowRight" && nextLink) {
        ev.preventDefault();
        history.push(nextLink);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [history, prevLink, nextLink]);

  return (
    <div className="PostNavigation">
      {prevLink ? (
        <Link to={prevLink} className="nav-button prev">
          <span className="arrow">&#8249;</span>
          <span className="label">Previous</span>
        </Link>
      ) : (
        <span className="nav-button prev disabled">
          <span className="arrow">&#8249;</span>
          <span className="label">Previous</span>
        </span>
      )}

      <span className="position">
        {navigation.position + 1} / {navigation.total}
      </span>

      {nextLink ? (
        <Link to={nextLink} className="nav-button next">
          <span className="label">Next</span>
          <span className="arrow">&#8250;</span>
        </Link>
      ) : (
        <span className="nav-button next disabled">
          <span className="label">Next</span>
          <span className="arrow">&#8250;</span>
        </span>
      )}
    </div>
  );
}
