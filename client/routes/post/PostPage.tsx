import React, { useMemo } from "react";
import { PostPageData, Relation } from "../../../server/routes/apiTypes";
import { fileUrl, MIME_STRING } from "../../../server/helpers/consts";
import { parseDuration, parseSize } from "../../helpers/utils";
import usePageData from "../../hooks/usePageData";
import useLocalStorage from "../../hooks/useLocalStorage";
import useConfig from "../../hooks/useConfig";
import Layout from "../../components/Layout";
import Thumbnail from "../../components/Thumbnail";
import Tags from "../../components/Tags";
import NotFoundPage from "../error/NotFoundPage";
import File from "./File";
import SourceLink from "./SourceLink";
import PostNavigation from "./PostNavigation";
import "./PostPage.scss";

const RELATION_STRING: Record<Relation, string> = {
  [Relation.ALTERNATE]: "Alternative",
  [Relation.DUPLICATE]: "Duplicate",
  [Relation.DUPLICATE_BEST]: "Duplicate (best)",
};

export default function PostPage() {
  const { ratingStars } = useConfig();
  const [pageData] = usePageData<PostPageData>();
  const [fullHeight] = useLocalStorage("fullHeight", false);
  
  const sortedRelations = useMemo(() => {
    if(!pageData?.post) return [];
    else return [...pageData.post.relations, pageData.post].sort((a, b) => a.id - b.id);
  }, [pageData?.post]);
  
  if(!pageData) {
    return (
      <Layout className="PostPage" />
    );
  }
  
  if(!pageData.post) {
    return <NotFoundPage />;
  }
  
  const link = fileUrl(pageData.post);
  
  let rating;
  if(ratingStars !== null) {
    if(pageData.post.rating !== null) {
      const stars = Math.round(pageData.post.rating * ratingStars);
      rating = (
        <div className="rating">
          <span className="gold">{"★".repeat(stars)}</span>
          <span className="gray">{"☆".repeat(ratingStars - stars)}</span>
        </div>
      );
    } else {
      rating = (
        <div className="rating">
          <span className="gray">{"★".repeat(ratingStars)}</span>
        </div>
      );
    }
  }
  
  const staticNotes = pageData.post.notes.filter(note => !note.rect);
  
  return (
    <Layout className={`PostPage${fullHeight ? " fullHeight" : ""}`}
            simpleSettings
            sidebar={<>
              {pageData.navigation && <PostNavigation navigation={pageData.navigation} />}
              {rating}
              <div className="namespace">
                <b>Statistics</b>
                <div>{pageData.post.size !== null && `Size: ${parseSize(pageData.post.size)}`}</div>
                <div>{pageData.post.width !== null && pageData.post.height !== null && `Dimensions: ${pageData.post.width}x${pageData.post.height}`}</div>
                <div>{pageData.post.mime !== null && MIME_STRING[pageData.post.mime] && `Mime: ${MIME_STRING[pageData.post.mime]}`}</div>
                <div>{pageData.post.duration !== null && `Duration: ${parseDuration(pageData.post.duration)}`}</div>
                <div>{pageData.post.nunFrames !== null && `Frames: ${pageData.post.nunFrames}`}</div>
                <div>{pageData.post.hasAudio !== null && `Audio: ${pageData.post.hasAudio ? "Yes" : "No"}`}</div>
                <div>Posted: {new Date(pageData.post.posted).toLocaleString()}</div>
                {pageData.post.inbox && <div>In inbox</div>}
                {pageData.post.trash && <div>In trash</div>}
                <div><b><a href={link} target="_blank" rel="noreferrer" download>Download This File</a></b></div>
              </div>
              {pageData.post.sources.length > 0 &&
                <div className="namespace">
                  <b>Sources</b>
                  {pageData.post.sources.map(url => <SourceLink key={url} url={url} />)}
                </div>
              }
              <Tags tags={pageData.post.tags} grouped />
              {staticNotes.map((note, id) => (
                <div className="namespace spaced note" key={id}>
                  <b>{note.label}</b>
                  <p>{note.note}</p>
                </div>
              ))}
            </>}> {/* eslint-disable-line react/jsx-closing-tag-location */}
      <div className="fileWrap">
        <File post={pageData.post} link={link} />
      </div>
      {pageData.post.relations.length > 0 &&
        <div className="relations">
          {sortedRelations.map(relation => <Thumbnail key={relation.id}
                                                      id={relation.id}
                                                      post={relation}
                                                      label={"kind" in relation ? RELATION_STRING[relation.kind] : <b>This Post</b>}
                                                      noFade />)}
        </div>
      }
    </Layout>
  );
}

