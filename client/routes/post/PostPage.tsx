import React from "react";
import { Link } from "react-router-dom";
import { Post, PostPageData } from "../../../server/routes/apiTypes";
import { Mime, MIME_STRING } from "../../../server/helpers/consts";
import usePageData from "../../hooks/usePageData";
import Layout from "../../components/Layout";
import Tags from "../../components/Tags";
import { parseDuration, parseSize } from "../../helpers/utils";
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
    return (
      <Layout className="PostPage">
        <h1>Post Not Found</h1>
        
        <Link to="/posts">See All Posts</Link>
      </Layout>
    );
  }
  
  const link = `/files/f${pageData.post.hash}${pageData.post.extension}`;
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
              <div className="stats">
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
              <Tags tags={pageData.post.tags} grouped />
            </>}> {/* eslint-disable-line react/jsx-closing-tag-location */}
      <File link={link} post={pageData.post} />
    </Layout>
  );
}

interface FileProps {
  link: string;
  post: Post;
}

function File({ link, post }: FileProps) {
  switch(post.mime) {
    case Mime.IMAGE_JPEG:
    case Mime.IMAGE_PNG:
    case Mime.IMAGE_GIF:
    case Mime.IMAGE_BMP:
    case Mime.IMAGE_ICON:
    case Mime.IMAGE_APNG:
    case Mime.UNDETERMINED_PNG:
    case Mime.IMAGE_WEBP:
    case Mime.IMAGE_TIFF:
    case Mime.GENERAL_IMAGE: {
      return (
        <a href={link} target="_blank" rel="noreferrer">
          <img className="File image" src={link} alt={String(post.id)}
               width={post.width || undefined} height={post.height || undefined} />
        </a>
      );
    }
    case Mime.VIDEO_FLV:
    case Mime.VIDEO_MP4:
    case Mime.VIDEO_WMV:
    case Mime.VIDEO_MKV:
    case Mime.VIDEO_WEBM:
    case Mime.UNDETERMINED_WM:
    case Mime.VIDEO_MPEG:
    case Mime.VIDEO_MOV:
    case Mime.VIDEO_AVI:
    case Mime.VIDEO_REALMEDIA:
    case Mime.GENERAL_VIDEO:
    case Mime.GENERAL_ANIMATION: {
      return (
        <video className="File video" controls
               width={post.width || undefined} height={post.height || undefined}>
          <source src={link} />
          Your browser does not support this video.
        </video>
      );
    }
    case Mime.AUDIO_MP3:
    case Mime.AUDIO_OGG:
    case Mime.AUDIO_FLAC:
    case Mime.AUDIO_WMA:
    case Mime.AUDIO_M4A:
    case Mime.AUDIO_REALMEDIA:
    case Mime.AUDIO_TRUEAUDIO:
    case Mime.GENERAL_AUDIO: {
      return <audio className="File audio" src={link} />;
    }
    case Mime.TEXT_HTML:
    case Mime.TEXT_PLAIN:
    case Mime.APPLICATION_JSON:
    case Mime.APPLICATION_YAML: {
      return <div className="File text">Here be the text</div>;
    }
    case Mime.APPLICATION_HYDRUS_CLIENT_COLLECTION:
    case Mime.APPLICATION_CLIP:
    case Mime.APPLICATION_OCTET_STREAM:
    case Mime.APPLICATION_UNKNOWN:
    case Mime.APPLICATION_FLASH:
    case Mime.APPLICATION_PDF:
    case Mime.APPLICATION_ZIP:
    case Mime.APPLICATION_HYDRUS_ENCRYPTED_ZIP:
    case Mime.APPLICATION_HYDRUS_UPDATE_DEFINITIONS:
    case Mime.APPLICATION_HYDRUS_UPDATE_CONTENT:
    case Mime.APPLICATION_RAR:
    case Mime.APPLICATION_7Z:
    case Mime.APPLICATION_PSD:
    case Mime.GENERAL_APPLICATION:
    default: {
      return <div className="File unknown">File{post.size ? post.size + " bytes" : ""}</div>;
    }
  }
}
