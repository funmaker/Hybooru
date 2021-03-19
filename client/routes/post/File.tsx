import React from "react";
import { Post } from "../../../server/routes/apiTypes";
import { Mime } from "../../../server/helpers/consts";

interface FileProps {
  link: string;
  post: Post;
}

export default function File({ link, post }: FileProps) {
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
