import isNode from 'detect-node';
import axios, { Method, Canceler } from 'axios';
import qs from 'query-string';

// eslint-disable-next-line @typescript-eslint/naming-convention
const CancelToken = axios.CancelToken;

interface RequestOptions {
  method?: Method;
  href?: string;
  host?: string;
  pathname?: string;
  search?: string | Record<string, any>;
  data?: any;
  cancelCb?: (cancel: Canceler) => void;
}

export default async function requestJSON(options: RequestOptions = {}) {
  if(isNode) return new Promise(() => {});
  let { method, href, host, pathname, search, cancelCb, data } = options;
  
  host = host || location.host;
  pathname = pathname || location.pathname;
  if(search && typeof search !== "string") {
    search = qs.stringify(search);
  }
  search = search ? "?" + search : location.search;
  href = href || `//${host}${pathname}${search}`;
  method = method || "GET";
  
  const response = await axios({
    method,
    url: href,
    data,
    cancelToken: cancelCb ? new CancelToken(cancelCb) : undefined,
  });
  
  return response.data;
}
