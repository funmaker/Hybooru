import React from "react";
import { PostPageData } from "../../../server/routes/apiTypes";
import { fileUrl, MIME_STRING } from "../../../server/helpers/consts";
import usePageData from "../../hooks/usePageData";
import Layout from "../../components/Layout";
import Tags from "../../components/Tags";
import NotFoundPage from "../error/NotFoundPage";
import { parseDuration, parseSize } from "../../helpers/utils";
import File from "./File";
import SourceLink from "./SourceLink";
import "./PostPage.scss";

const STARS_COUNT = 5;

export default function PostPage() {
  const [pageData] = usePageData<PostPageData>();
  
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
  if(pageData.post.rating !== null) {
    const stars = Math.round(pageData.post.rating * STARS_COUNT);
    rating = (
      <div className="rating">
        <span className="gold">{"★".repeat(stars)}</span>
        <span className="gray">{"☆".repeat(STARS_COUNT - stars)}</span>
      </div>
    );
  } else {
    rating = (
      <div className="rating">
        <span className="gray">{"★".repeat(STARS_COUNT)}</span>
      </div>
    );
  }
  
  return (
    <Layout className="PostPage"
            sidebar={<>
              {rating}
              <div className="namespace">
                <b>Statistics:</b>
                <div>{pageData.post.size !== null && `Size: ${parseSize(pageData.post.size)}`}</div>
                <div>{pageData.post.width !== null && pageData.post.height !== null && `Dimensions: ${pageData.post.width}x${pageData.post.height}`}</div>
                <div>{pageData.post.mime !== null && MIME_STRING[pageData.post.mime] && `Mime: ${MIME_STRING[pageData.post.mime]}`}</div>
                <div>{pageData.post.duration !== null && `Duration: ${parseDuration(pageData.post.duration)}`}</div>
                <div>{pageData.post.nunFrames !== null && `Frames: ${pageData.post.nunFrames}`}</div>
                <div>{pageData.post.hasAudio !== null && `Audio: ${pageData.post.hasAudio ? "Yes" : "No"}`}</div>
                <div>Posted: {new Date(pageData.post.posted).toLocaleString()}</div>
                <div><b><a href={link} target="_blank" rel="noreferrer" download>Download This File</a></b></div>
              </div>
              {pageData.post.sources.length > 0 &&
                <div className="namespace">
                  <b>Sources:</b>
                  {pageData.post.sources.map(url => <SourceLink key={url} url={url} />)}
                </div>
              }
              <Tags tags={pageData.post.tags} grouped />
            </>}> {/* eslint-disable-line react/jsx-closing-tag-location */}
      <File link={link} post={pageData.post} />
    </Layout>
  );
}
