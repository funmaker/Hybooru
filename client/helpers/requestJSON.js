import isNode from 'detect-node';
import axios from 'axios';

const CancelToken = axios.CancelToken;

export default function requestJSON({method, href, host, pathname, search, cancelCb}) {
    if(isNode) return new Promise(() => {});

    host = host || `api.${location.hostname}`;
    pathname = pathname || location.pathname;
    search = search || location.search;
    href = href || `${host}${pathname}${search}`;
    method = method || "GET";

    return axios.create({
        method: method.toLowerCase(),
        url: href,
        cancelToken: new CancelToken(cancelCb),
    });
}
