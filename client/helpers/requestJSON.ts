import isNode from 'detect-node';
import axios, { Method, Canceler } from 'axios';
import { toast } from "react-toastify";
import qs from 'query-string';

// eslint-disable-next-line @typescript-eslint/naming-convention
const CancelToken = axios.CancelToken;

interface RequestOptions<Req> {
  method?: Method;
  href?: string;
  host?: string;
  pathname?: string;
  search?: string | Req;
  data?: Req;
  cancelCb?: (cancel: Canceler) => void;
}

export default async function requestJSON<Res, Req extends Record<string, any> = Record<string, any>>(options: RequestOptions<Req> = {}): Promise<Res> {
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
  
  let response;
  try {
    response = await axios({
      method,
      url: href,
      data,
      cancelToken: cancelCb ? new CancelToken(cancelCb) : undefined,
    });
  } catch(err) {
    toast.error(err.response?.data?.error?.message || err.message);
    throw err;
  }
  
  return response.data;
}
