import React, { useCallback } from "react";
import { useLocation } from "wouter";
import { anyRatingRegex } from "../../server/helpers/consts";
import { RegenDBRequest, RegenDBResponse } from "../../types/api";
import { qsStringify } from "../helpers/utils";
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
  const { parts, setQuery } = useQuery();
  const [config] = useConfig();
  const [location, navigate] = useLocation();
  
  const [pagination, setPagination] = useLocalStorage("pagination", false);
  const [popup, setPopup] = useLocalStorage("popup", false);
  const [namespaces, setNamespaces] = useLocalStorage("namespaces", false);
  const [fullHeight, setFullHeight] = useLocalStorage("fullHeight", false);
  const [thumbnailFade, setThumbnailFade] = useLocalStorage("thumbnailFade", true);
  const [blurhash, setBlurhash] = useLocalStorage("blurhash", false);
  const togglePagination = useCallback((ev: React.MouseEvent) => { ev.preventDefault(); setPagination(!pagination); }, [pagination, setPagination]);
  const togglePopup = useCallback((ev: React.MouseEvent) => { ev.preventDefault(); setPopup(!popup); }, [popup, setPopup]);
  const toggleNamespaces = useCallback((ev: React.MouseEvent) => { ev.preventDefault(); setNamespaces(!namespaces); }, [namespaces, setNamespaces]);
  const toggleFullHeight = useCallback((ev: React.MouseEvent) => { ev.preventDefault(); setFullHeight(!fullHeight); }, [fullHeight, setFullHeight]);
  const toggleThumbnailFade = useCallback((ev: React.MouseEvent) => { ev.preventDefault(); setThumbnailFade(!thumbnailFade); }, [thumbnailFade, setThumbnailFade]);
  const toggleBlurhash = useCallback((ev: React.MouseEvent) => { ev.preventDefault(); setBlurhash(!blurhash); }, [blurhash, setBlurhash]);
  
  const onSort = useCallback((ev: React.ChangeEvent<HTMLSelectElement>) => {
    const query = [
      ...parts.filter(s => !s.startsWith("order:")),
      `order:${ev.target.value}`,
    ].join(" ");
    
    setQuery(query);
  }, [parts, setQuery]);
  
  const onRating = useCallback((ev: React.ChangeEvent<HTMLSelectElement>) => {
    const query = [
      ...parts.filter(s => !s.match(anyRatingRegex)),
      `rating:${ev.target.value}`,
    ].join(" ");
    
    setQuery(query);
  }, [parts, setQuery]);
  
  const onDbRegen = useCallback(async (ev: React.MouseEvent) => {
    ev.preventDefault();
    const password = prompt("Password");
    
    if(password !== null) {
      await requestJSON<RegenDBResponse, RegenDBRequest>({
        url: "/api/regendb",
        method: "POST",
        data: { password },
        headers: {
          "X-Hybooru-No-Auth": true,
        },
      });
      
      navigate("/lock" + qsStringify({ redirect: location }));
    }
  }, [location, navigate]);
  
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
          {config.sortPresets.map((preset, id) => (
            <React.Fragment key={id}>
              <option value={preset}>{formatPreset(preset)} (Descending)</option>
              <option value={preset + "_asc"}>{formatPreset(preset)} (Ascending)</option>
            </React.Fragment>
          ))}
          <option value="id">Id</option>
        </select>
      </div>
      {config.ratingStars !== null && (
        <div>
          <select value="label" onChange={onRating}>
            <option value="label" disabled hidden>Rating</option>
            {new Array(config.ratingStars + 1).fill(0)
                                              .map((_, id) => <option key={id} value={id.toString()}>{id}</option>)
                                              .reverse()}
            <option value="none">Not Rated</option>
            <option value="">Any Rating</option>
          </select>
        </div>
      )}
      <hr />
    </>; // eslint-disable-line @stylistic/jsx-closing-tag-location
  }
  
  let adminButtons: React.ReactNode = null;
  if(config.passwordSet) {
    adminButtons = <>
      <hr />
      <div><a href="#" onClick={onDbRegen}>Rebuild Database</a></div>
    </>; // eslint-disable-line @stylistic/jsx-closing-tag-location
  }
  
  if(!open) return null;
  else return (
    <div className="SettingsMenu" {...rest}>
      {extraSettings}
      <div><a href="#" onClick={togglePagination}>Auto Paging: {!pagination ? "Yes" : "No"}</a></div>
      <div><a href="#" onClick={togglePopup}>Popup Gallery: {popup ? "Yes" : "No"}</a></div>
      <div><a href="#" onClick={toggleNamespaces}>Hide Namespaces: {namespaces ? "No" : "Yes"}</a></div>
      <div><a href="#" onClick={toggleFullHeight}>Limit Img Height: {fullHeight ? "No" : "Yes"}</a></div>
      <div><a href="#" onClick={toggleThumbnailFade}>Thumbnail Fade: {thumbnailFade ? "Yes" : "No"}</a></div>
      <div><a href="#" onClick={toggleBlurhash}>Blurhash: {blurhash ? "Yes" : "No"}</a></div>
      {adminButtons}
    </div>
  );
}

const formatPreset = (preset: string) => preset.slice(0, 1).toUpperCase() + preset.slice(1).replace(/_/g, " ");
