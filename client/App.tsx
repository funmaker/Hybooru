import React, { useEffect } from 'react';
import { Route, Switch } from "react-router";
import { toast, ToastContainer } from 'react-toastify';
import { hot } from 'react-hot-loader';
import { InitialData } from "../server/routes/apiTypes";
import { PageDataProvider } from "./hooks/usePageData";
import { SSRProvider } from "./hooks/useSSR";
import { ConfigContextProvider } from "./hooks/useConfig";
import { ThemeProvider } from "./hooks/useTheme";
import { PostsCacheProvider } from "./hooks/usePostsCache";
import { QueryProvider } from "./hooks/useQuery";
import ClientError from "./helpers/clientError";
import DiagnosticsPage from "./routes/diagnostics/DiagnosticsPage";
import IndexPage from "./routes/index/IndexPage";
import SearchPage from "./routes/search/SearchPage";
import PostPage from "./routes/post/PostPage";
import RandomPage from "./routes/random/RandomPage";
import TagsPage from "./routes/tags/TagsPage";
import LockPage from "./routes/lock/LockPage";
import ErrorPage from "./routes/error/ErrorPage";
import "./globals.scss";

interface Props {
  initialData: InitialData;
}

const MIN_PAGE_SIZE = 612;
export const EM_SIZE = 20;

const notFoundError = new ClientError({ code: 404, message: "Page Not Found" });

// eslint-disable-next-line prefer-arrow-callback
export default hot(module)(function App({ initialData }: Props) {
  useEffect(() => {
    const onResize = () => {
      const minSize = Math.min(window.innerWidth, window.innerHeight);
      const fontSize = Math.min(1, minSize / MIN_PAGE_SIZE) * EM_SIZE;
      document.documentElement.style.fontSize = fontSize + "px";
    };
    
    if(initialData._ssrError) {
      toast.error("There was an error during Server Side Rendering.");
    }
    
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [initialData]);
  
  return (
    <SSRProvider>
      <ThemeProvider init={initialData._theme}>
        <ConfigContextProvider config={initialData._config}>
          <QueryProvider>
            <PageDataProvider initialData={initialData}>
              <PostsCacheProvider>
                <Switch>
                  <Route path="/tags" component={TagsPage} />
                  <Route path="/posts/:id" component={PostPage} />
                  <Route path="/posts" component={SearchPage} />
                  <Route path="/random" component={RandomPage} />
                  <Route path="/diagnostics" component={DiagnosticsPage} />
                  <Route path="/lock" component={LockPage} />
                  <Route path="/" exact component={IndexPage} />
                  <ErrorPage error={notFoundError} />
                </Switch>
                <ToastContainer />
              </PostsCacheProvider>
            </PageDataProvider>
          </QueryProvider>
        </ConfigContextProvider>
      </ThemeProvider>
    </SSRProvider>
  );
});
