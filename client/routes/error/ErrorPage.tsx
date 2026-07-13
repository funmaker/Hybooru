import React from 'react';
import { Link } from "react-router-dom";
import Logo from "../../components/Logo";
import ClientError from "../../helpers/clientError";
import Layout from "../../components/Layout";
import "./ErrorPage.scss";

interface ErrorPageProps {
  error: ClientError;
}

export default function ErrorPage({ error }: ErrorPageProps): JSX.Element {
  return (
    <Layout className="ErrorPage" plain noError>
      <Logo />
      
      <h4>{error.status} - {error.message}</h4>
      
      <Link to="/posts">See All Posts</Link>
      
      {error.stack && <pre>{error.stack}</pre>}
    </Layout>
  );
}
