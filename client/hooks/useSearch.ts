import qs from "query-string";
import { useLocation } from "react-router";

export default function useSearch() {
  return qs.parse(useLocation().search);
}
