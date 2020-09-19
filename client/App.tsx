import React from 'react';
import { Redirect, Route, Switch } from "react-router";
import { hot } from 'react-hot-loader';
import IndexPage from "./routes/index/IndexPage";
import ErrorPage from "./routes/error/ErrorPage";
import { usePageDataInit, PageDataContext } from "./helpers/usePageData";
import "./globals.scss";

interface Props {
  initialData: any;
}

// eslint-disable-next-line prefer-arrow-callback
export default hot(module)(function App({ initialData }: Props) {
  const contextData = usePageDataInit(initialData);
  
  let content;
  if(initialData.error) {
    content = <ErrorPage error={initialData.error} />;
  } else {
    content = (
      <Switch>
        <Route path="/" exact component={IndexPage} />
        <Redirect to="/" />
      </Switch>
    );
  }
  
  return (
    <PageDataContext.Provider value={contextData}>
      {content}
    </PageDataContext.Provider>
  );
});
