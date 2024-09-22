import React, { useReducer, useRef } from "react";
import { Post, PostNote, PostSummary } from "../../../server/routes/apiTypes";
import { fileUrl, Mime } from "../../../server/helpers/consts";
import { classJoin, parseSize } from "../../helpers/utils";
import useConfig from "../../hooks/useConfig";
import useSSR from "../../hooks/useSSR";
import useChange from "../../hooks/useChange";
import Ruffle from "../../components/Ruffle";
import "./File.scss";

interface FileProps {
  post: Post | PostSummary;
  link?: string;
  className?: string;
  paused?: boolean;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
}

export default function File({ post, link, className, paused, controls = true, autoPlay = !paused, muted, ...rest }: FileProps & React.HTMLAttributes<HTMLElement>) {
  const config = useConfig();
  const SSR = useSSR();
  const [error, setError] = useReducer(() => true, false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const width = "width" in post && post.width || undefined;
  const height = "height" in post && post.height || undefined;
  const size = post.size && parseSize(post.size);
  className = className ? ` ${className}` : "";
  
  let mime = post.mime;
  if(error
  || (post.size && post.size > config.maxPreviewSize)
  || (post.mime === Mime.APPLICATION_FLASH && SSR)) {
    mime = Mime.GENERAL_APPLICATION;
  }
  
  const notes = "notes" in post ? post.notes.filter(note => !!note.rect) : undefined;
  
  useChange(post.id, () => videoRef.current && videoRef.current.load());
  useChange(paused, () => {
    const media = videoRef.current || audioRef.current;
    if(!media) return;
    else if(paused && !media.paused) media.pause();
    else if(!paused && media.paused) media.play();
  });
  
  switch(mime) {
    case Mime.IMAGE_JPEG:
    case Mime.IMAGE_PNG:
    case Mime.IMAGE_GIF:
    case Mime.IMAGE_BMP:
    case Mime.IMAGE_ICON:
    case Mime.ANIMATION_GIF:
    case Mime.ANIMATION_APNG:
    case Mime.UNDETERMINED_PNG:
    case Mime.IMAGE_WEBP:
    case Mime.IMAGE_TIFF:
    case Mime.IMAGE_SVG:
    case Mime.IMAGE_HEIF:
    case Mime.IMAGE_HEIF_SEQUENCE:
    case Mime.IMAGE_HEIC:
    case Mime.IMAGE_HEIC_SEQUENCE:
    case Mime.IMAGE_AVIF:
    case Mime.IMAGE_AVIF_SEQUENCE:
    case Mime.UNDETERMINED_GIF:
    case Mime.IMAGE_QOI:
    case Mime.GENERAL_IMAGE: {
      return (
        <FileWrap className={className} width={width} height={height} link={link} notes={notes}>
          <img className="image" src={fileUrl(post)} alt={String(post.id)}
               width={width} height={height} onError={setError} {...rest} />
        </FileWrap>
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
    case Mime.VIDEO_OGV:
    case Mime.UNDETERMINED_MP4:
    case Mime.GENERAL_VIDEO:
    case Mime.GENERAL_ANIMATION: {
      return (
        <FileWrap className={className} width={width} height={height} link={controls ? undefined : link} notes={notes}>
          <video className="video" controls={controls} autoPlay={autoPlay} loop muted={muted}
                 width={width} height={height} onError={setError} ref={videoRef} {...rest}>
            <source src={fileUrl(post)} />
            Your browser does not support this video.
          </video>
        </FileWrap>
      );
    }
    case Mime.AUDIO_MP3:
    case Mime.AUDIO_OGG:
    case Mime.AUDIO_FLAC:
    case Mime.AUDIO_WMA:
    case Mime.AUDIO_M4A:
    case Mime.AUDIO_REALMEDIA:
    case Mime.AUDIO_TRUEAUDIO:
    case Mime.AUDIO_WAVE:
    case Mime.AUDIO_MKV:
    case Mime.AUDIO_MP4:
    case Mime.AUDIO_WAVPACK:
    case Mime.GENERAL_AUDIO: {
      return (
        <FileWrap className={className} notes={notes}>
          <audio className="audio" src={fileUrl(post)} autoPlay={autoPlay && !muted} loop controls onError={setError} ref={audioRef} {...rest} />
        </FileWrap>
      );
    }
    case Mime.APPLICATION_FLASH: {
      return (
        <FileWrap className={className} width={width} height={height}>
          <Ruffle url={fileUrl(post)} width={width} height={height} />
        </FileWrap>
      );
    }
    case Mime.TEXT_HTML:
    case Mime.TEXT_PLAIN:
    case Mime.APPLICATION_JSON:
    case Mime.APPLICATION_YAML:
    case Mime.APPLICATION_HYDRUS_CLIENT_COLLECTION:
    case Mime.APPLICATION_CLIP:
    case Mime.APPLICATION_OCTET_STREAM:
    case Mime.APPLICATION_UNKNOWN:
    case Mime.APPLICATION_PDF:
    case Mime.APPLICATION_ZIP:
    case Mime.APPLICATION_HYDRUS_ENCRYPTED_ZIP:
    case Mime.APPLICATION_HYDRUS_UPDATE_DEFINITIONS:
    case Mime.APPLICATION_HYDRUS_UPDATE_CONTENT:
    case Mime.APPLICATION_RAR:
    case Mime.APPLICATION_7Z:
    case Mime.APPLICATION_PSD:
    case Mime.APPLICATION_CBOR:
    case Mime.APPLICATION_WINDOWS_EXE:
    case Mime.APPLICATION_SAI2:
    case Mime.APPLICATION_KRITA:
    case Mime.APPLICATION_XCF:
    case Mime.APPLICATION_GZIP:
    case Mime.APPLICATION_PROCREATE:
    case Mime.GENERAL_APPLICATION_ARCHIVE:
    case Mime.GENERAL_IMAGE_PROJECT:
    case Mime.GENERAL_APPLICATION:
    default: {
      return (
        <FileWrap className={className} link={link} notes={notes}>
          <div className="unknown" data-ext={post.extension.slice(1)} data-size={size}>
            <img src="/static/file.svg" alt={String(post.id)} {...rest} />
          </div>
        </FileWrap>
      );
    }
  }
}

interface FileWrapProps {
  className?: string;
  width?: number;
  height?: number;
  link?: string;
  notes?: PostNote[];
  children?: React.ReactNode;
}

function FileWrap({ className, width, height, link, notes, children }: FileWrapProps) {
  const style = (width !== undefined && height !== undefined) ? {
    aspectRatio: `${width} / ${height}`,
  } : undefined;
  
  const domNotes = notes?.map((note, id) => (
    <div key={id}
         className="note"
         data-content={note.note}
         style={{
           left: `${note.rect?.left || 0}%`,
           top: `${note.rect?.top || 0}%`,
           width: `${note.rect?.width || 0}%`,
           height: `${note.rect?.height || 0}%`,
         }} />
  ));
  
  if(link) return <a className={classJoin("File", className)} style={style} href={link}>{children}{domNotes}</a>;
  else return <div className={classJoin("File", className)} style={style}>{children}{domNotes}</div>;
}
