import React, { useEffect } from 'react';
import { Redirect, Route, Switch } from "react-router";
import { toast, ToastContainer } from 'react-toastify';
import { hot } from 'react-hot-loader';
import { usePageDataInit, PageDataContext } from "./helpers/usePageData";
import IndexPage from "./routes/index/IndexPage";
import SearchPage from "./routes/search/SearchPage";
import PostPage from "./routes/post/PostPage";
import "./globals.scss";

interface Props {
  initialData: any;
}

const MIN_PAGE_SIZE = 612;

// eslint-disable-next-line prefer-arrow-callback
export default hot(module)(function App({ initialData }: Props) {
  const contextData = usePageDataInit(initialData);
  
  useEffect(() => {
    const onResize = () => {
      const minSize = Math.min(window.innerWidth, window.innerHeight);
      const fontSize = Math.min(1, minSize / MIN_PAGE_SIZE) * 20;
      document.documentElement.style.fontSize = fontSize + "px";
    };
    
    if(initialData._error) {
      toast.error(initialData._error.message);
    }
    
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [initialData._error]);
  
  return (
    <PageDataContext.Provider value={contextData}>
      <Switch>
        <Route path="/posts/:id" component={PostPage} />
        <Route path="/posts" component={SearchPage} />
        <Route path="/" exact component={IndexPage} />
        <Redirect to="/" />
      </Switch>
      <ToastContainer />
    </PageDataContext.Provider>
  );
});
