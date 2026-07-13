import { createBrowserHistory, createMemoryHistory } from "history";
import isNode from "detect-node";

const history = isNode ? createMemoryHistory() : createBrowserHistory();
export default history;
