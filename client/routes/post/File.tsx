import React from "react";
import { Post, PostSummary } from "../../../server/routes/apiTypes";
import { fileUrl, Mime } from "../../../server/helpers/consts";

interface FileProps {
  post: Post | PostSummary;
  link?: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
}

export default function File({ post, link, className, controls = true, autoPlay = true, muted, ...rest }: FileProps & React.HTMLAttributes<HTMLElement>) {
  const width = "width" in post && post.width || undefined;
  const height = "height" in post && post.height || undefined;
  const size = "size" in post && post.size ? post.size + " bytes" : undefined;
  className = className ? ` ${className}` : "";
  
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
      const img = <img className={`File image${className}`} src={fileUrl(post)} alt={String(post.id)}
                       width={width} height={height} {...rest} />;
      
      if(link) return <a href={fileUrl(post)} target="_blank" rel="noreferrer">{img}</a>;
      else return img;
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
        <video className={`File video${className}`} controls={controls} autoPlay={autoPlay} loop muted={muted}
               width={width} height={height} {...rest}>
          <source src={fileUrl(post)} />
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
      return <audio className={`File audio${className}`} src={fileUrl(post)} {...rest} />;
    }
    case Mime.TEXT_HTML:
    case Mime.TEXT_PLAIN:
    case Mime.APPLICATION_JSON:
    case Mime.APPLICATION_YAML: {
      return <div className={`File text${className}`} {...rest}>Here be the text</div>;
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
      return <div className={`File unknown${className}`} {...rest}>File{size}</div>;
    }
  }
}
