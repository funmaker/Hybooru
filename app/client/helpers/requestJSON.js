import isNode from 'detect-node';
import axios from 'axios';
import qs from 'query-string';

const CancelToken = axios.CancelToken;

export default async function requestJSON({method, href, host, pathname, search, cancelCb} = {}) {
    if(isNode) return new Promise(() => {});

    host = host || location.host;
    pathname = pathname || location.pathname;
    if(search instanceof Object) {
        search = qs.stringify(search);
    }
    search = search ? "?" + search : location.search;
    href = href || `//${host}${pathname}${search}`;
    method = method || "GET";

    const response = await axios({
        method: method.toLowerCase(),
        url: href,
        cancelToken: cancelCb ? new CancelToken(cancelCb) : undefined,
    });

    return response.data;
}
