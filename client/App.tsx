import React, { useEffect } from 'react';
import { Redirect, Route, Switch } from "react-router";
import { toast, ToastContainer } from 'react-toastify';
import { hot } from 'react-hot-loader';
import { RegenDBRequest } from "../server/routes/apiTypes";
import { usePageDataInit, PageDataContext } from "./hooks/usePageData";
import { SSRProvider } from "./hooks/useSSR";
import { ConfigContext } from "./hooks/useConfig";
import { CSRFContext } from "./hooks/useCSRF";
import { ThemeProvider } from "./hooks/useTheme";
import requestJSON from "./helpers/requestJSON";
import TestPage from "./routes/TestPage";
import IndexPage from "./routes/index/IndexPage";
import SearchPage from "./routes/search/SearchPage";
import PostPage from "./routes/post/PostPage";
import TagsPage from "./routes/tags/TagsPage";
import "./globals.scss";

interface Props {
  initialData: any;
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
    
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [initialData._error]);
  
  useEffect(() => {
    if(typeof window !== "undefined") {
      (window as any).regenDB = async () => {
        const password = prompt("Password");
        
        if(password !== null) {
          await requestJSON<null, RegenDBRequest>({
            pathname: "/api/regenDB",
            method: "POST",
            data: { password, _csrf: initialData._csrf },
          });
        }
      };
    }
  }, []);
  
  return (
    <SSRProvider>
      <ThemeProvider init={initialData._theme}>
        <CSRFContext.Provider value={initialData._csrf}>
          <ConfigContext.Provider value={initialData._config}>
            <PageDataContext.Provider value={contextData}>
              <Switch>
                <Route path="/test" component={TestPage} />
                <Route path="/tags" component={TagsPage} />
                <Route path="/posts/:id" component={PostPage} />
                <Route path="/posts" component={SearchPage} />
                <Route path="/" exact component={IndexPage} />
                <Redirect to="/" />
              </Switch>
              <ToastContainer />
            </PageDataContext.Provider>
          </ConfigContext.Provider>
        </CSRFContext.Provider>
      </ThemeProvider>
    </SSRProvider>
  );
});
