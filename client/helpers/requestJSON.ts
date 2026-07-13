import isNode from 'detect-node';
import axios, { Canceler, AxiosRequestConfig } from 'axios';
import history from "./history";
import { qsStringify } from './utils';
import ClientError from "./clientError";

// eslint-disable-next-line @typescript-eslint/naming-convention
const CancelToken = axios.CancelToken;

interface RequestOptions<Req> extends Omit<AxiosRequestConfig<Req>, "cancelToken"> {
  search?: string | Req;
  cancelCb?: (cancel: Canceler) => void;
  waitFix?: boolean; // TODO: Need proper fix for ns_binding_aborted
}

export default async function requestJSON<Res = void, Req = never>({ url = "", search, cancelCb, waitFix, ...rest }: RequestOptions<Req> = {}): Promise<Res> {
  if(isNode) return new Promise(() => {});
  
  if(search && typeof search !== "string") search = qsStringify(search);
  if(search) url += search;
  
  if(waitFix) await new Promise(res => setTimeout(res, 0));
  
  try {
    const response = await axios({
      ...rest,
      url,
      cancelToken: cancelCb ? new CancelToken(cancelCb) : undefined,
    });
    
    return response.data;
  } catch(err: any) {
    const error = new ClientError(err);
    
    if(error.response?.headers?.["x-hybooru-dblock"] === "true") {
      history.replace(`/lock${qsStringify({ redirect: history.location.pathname + history.location.search })}`);
      error.isCancel = true;
    }
    
    if(!error.isCancel) error.prepareNotify();
    
    throw error;
  }
}
