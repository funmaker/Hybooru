import React, { useCallback } from "react";
import { anyRatingRegex } from "../../server/helpers/consts";
import { RegenDBRequest } from "../../server/routes/apiTypes";
import useLocalStorage from "../hooks/useLocalStorage";
import requestJSON from "../helpers/requestJSON";
import useConfig from "../hooks/useConfig";
import useQuery from "../hooks/useQuery";
import "./SettingsMenu.scss";

type SettingsMenuProps = {
  open?: boolean;
  simpleSettings?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export default function SettingsMenu({ open = false, simpleSettings = false, ...rest }: SettingsMenuProps) {
  const [, setQuery] = useQuery();
  const config = useConfig();
  
  const [pagination, setPagination] = useLocalStorage("pagination", false);
  const [popup, setPopup] = useLocalStorage("popup", false);
  const [namespaces, setNamespaces] = useLocalStorage("namespaces", false);
  const [fullHeight, setFullHeight] = useLocalStorage("fullHeight", false);
  const togglePagination = useCallback((ev: React.MouseEvent) => { ev.preventDefault(); setPagination(!pagination); }, [pagination, setPagination]);
  const togglePopup = useCallback((ev: React.MouseEvent) => { ev.preventDefault(); setPopup(!popup); }, [popup, setPopup]);
  const toggleNamespaces = useCallback((ev: React.MouseEvent) => { ev.preventDefault(); setNamespaces(!namespaces); }, [namespaces, setNamespaces]);
  const toggleFullHeight = useCallback((ev: React.MouseEvent) => { ev.preventDefault(); setFullHeight(!fullHeight); }, [fullHeight, setFullHeight]);
  
  const onSort = useCallback((ev: React.ChangeEvent<HTMLSelectElement>) => {
    setQuery(query => {
      let newQuery = query.trimRight()
                          .split(" ")
                          .filter(s => !s.startsWith("order:"))
                          .join(" ");
      
      if(newQuery && !newQuery.endsWith(" ")) newQuery += " ";
      
      return newQuery + `order:${ev.target.value}`;
    });
  }, [setQuery]);
  
  const onRating = useCallback((ev: React.ChangeEvent<HTMLSelectElement>) => {
    setQuery(query => {
      let newQuery = query.trimRight()
                          .split(" ")
                          .filter(s => !s.match(anyRatingRegex))
                          .join(" ");
      
      if(newQuery && !newQuery.endsWith(" ")) newQuery += " ";
      
      if(ev.target.value) return newQuery + `rating:${ev.target.value}`;
      else return newQuery;
    });
  }, [setQuery]);
  
  const onDbRegen = useCallback(async (ev: React.MouseEvent) => {
    ev.preventDefault();
    const password = prompt("Password");
    
    if(password !== null) {
      await requestJSON<null, RegenDBRequest>({
        pathname: "/api/regenDB",
        method: "POST",
        data: { password },
      });
      
      window.location.reload();
    }
  }, []);
  
  let extraSettings: React.ReactNode = null;
  if(!simpleSettings) {
    extraSettings = <>
      <div>
        <select value="label" onChange={onSort}>
          <option value="label" disabled hidden>Sorting</option>
          <option value="date">Date Imported (Newest First)</option>
          <option value="date_asc">Date Imported (Oldest First)</option>
          <option value="score">Score (Descending)</option>
          <option value="score_asc">Score (Ascending)</option>
          <option value="size">File Size (Descending)</option>
          <option value="size_asc">File Size (Ascending)</option>
          <option value="id">Id</option>
        </select>
      </div>
      {config.ratingStars !== null &&
        <div>
          <select value="label" onChange={onRating}>
            <option value="label" disabled selected hidden>Rating</option>
            {new Array(config.ratingStars + 1).fill(0)
                                              .map((_, id) => <option key={id} value={id.toString()}>{id}</option>)
                                              .reverse()}
            <option value="none">Not Rated</option>
            <option value="">Any Rating</option>
          </select>
        </div>
      }
      <hr />
    </>; // eslint-disable-line react/jsx-closing-tag-location
  }
  
  let adminButtons: React.ReactNode = null;
  if(config.passwordSet) {
    adminButtons = <>
      <hr />
      <div><a href="#" onClick={onDbRegen}>Rebuild Database</a></div>
    </>; // eslint-disable-line react/jsx-closing-tag-location
  }
  
  if(!open) return null;
  else return (
    <div className="SettingsMenu" {...rest}>
      {extraSettings}
      <div><a href="#" onClick={togglePagination}>Auto Paging: {!pagination ? "Yes" : "No"}</a></div>
      <div><a href="#" onClick={togglePopup}>Popup Gallery: {popup ? "Yes" : "No"}</a></div>
      <div><a href="#" onClick={toggleNamespaces}>Hide Namespaces: {namespaces ? "No" : "Yes"}</a></div>
      <div><a href="#" onClick={toggleFullHeight}>Limit Img Height: {fullHeight ? "No" : "Yes"}</a></div>
      {adminButtons}
    </div>
  );
}
