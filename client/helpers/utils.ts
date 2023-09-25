import qs from "qs";

export function classJoin(...classes: Array<string | null | undefined | false>) {
  return classes.filter(x => x).join(" ") || undefined;
}

export function qsStringify(obj: any, options?: qs.IStringifyOptions) {
  return qs.stringify(
    obj,
    {
      arrayFormat: "brackets",
      addQueryPrefix: true,
      ...options,
    },
  );
}

export function qsParse(str: string, options?: qs.IParseOptions) {
  return qs.parse(
    str,
    {
      ignoreQueryPrefix: true,
      ...options,
    },
  );
}

export function parseSize(size: number) {
  if(size > 1024 * 1024 * 1024 * 1024) {
    return Math.round(size / 1024 / 1024 / 1024 / 1024 * 100) / 100 + " TB";
  } else if(size > 1024 * 1024 * 1024) {
    return Math.round(size / 1024 / 1024 / 1024 * 100) / 100 + " GB";
  } else if(size > 1024 * 1024) {
    return Math.round(size / 1024 / 1024 * 100) / 100 + " MB";
  } else if(size > 1024) {
    return Math.round(size / 1024 * 100) / 100 + " KB";
  } else {
    return Math.round(size * 100) / 100 + " B";
  }
}

export function parseDuration(duration: number) {
  const h = Math.floor(duration / 60 / 60 / 1000);
  const m = Math.floor(duration / 60 / 1000 % 60).toString();
  const s = Math.floor(duration / 1000 % 60).toString();
  const ms = Math.floor(duration % 1000).toString();
  let text;
  
  if(h > 0) {
    text = `${h}:${m.padStart(2, "0")}:${s.padStart(2, "0")}.${ms.padStart(4, "0")}`;
  } else {
    text = `${m}:${s.padStart(2, "0")}.${ms.padStart(3, "0")}`;
  }
  
  return text;
}
