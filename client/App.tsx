import React, { useEffect } from 'react';
import { Route, Switch } from "react-router";
import { toast, ToastContainer } from 'react-toastify';
import { hot } from 'react-hot-loader';
import { AnySSRPageData } from "../server/routes/apiTypes";
import { usePageDataInit, PageDataContext } from "./hooks/usePageData";
import { SSRProvider } from "./hooks/useSSR";
import { ConfigContext } from "./hooks/useConfig";
import { CSRFContext } from "./hooks/useCSRF";
import { ThemeProvider } from "./hooks/useTheme";
import { PostsCacheProvider } from "./hooks/usePostsCache";
import { QueryProvider } from "./hooks/useQuery";
import TestPage from "./routes/TestPage";
import IndexPage from "./routes/index/IndexPage";
import SearchPage from "./routes/search/SearchPage";
import PostPage from "./routes/post/PostPage";
import TagsPage from "./routes/tags/TagsPage";
import NotFoundPage from "./routes/error/NotFoundPage";
import "./globals.scss";

interface Props {
  initialData: AnySSRPageData;
}

const MIN_PAGE_SIZE = 612;
export const EM_SIZE = 20;

// eslint-disable-next-line prefer-arrow-callback
export default hot(module)(function App({ initialData }: Props) {
  const contextData = usePageDataInit(initialData);
  
  useEffect(() => {
    const onResize = () => {
      const minSize = Math.min(window.innerWidth, window.innerHeight);
      const fontSize = Math.min(1, minSize / MIN_PAGE_SIZE) * EM_SIZE;
      document.documentElement.style.fontSize = fontSize + "px";
    };
    
    if(initialData._error) {
      toast.error(initialData._error.message);
    }
    
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
        <CSRFContext.Provider value={initialData._csrf}>
          <ConfigContext.Provider value={initialData._config}>
            <QueryProvider>
              <PageDataContext.Provider value={contextData}>
                <PostsCacheProvider>
                  <Switch>
                    <Route path="/test" component={TestPage} />
                    <Route path="/tags" component={TagsPage} />
                    <Route path="/posts/:id" component={PostPage} />
                    <Route path="/posts" component={SearchPage} />
                    <Route path="/" exact component={IndexPage} />
                    <NotFoundPage />
                  </Switch>
                  <ToastContainer />
                </PostsCacheProvider>
              </PageDataContext.Provider>
            </QueryProvider>
          </ConfigContext.Provider>
        </CSRFContext.Provider>
      </ThemeProvider>
    </SSRProvider>
  );
});
