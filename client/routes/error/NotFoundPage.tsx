import React from 'react';
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import "./NotFoundPage.scss";

export default function NotFoundPage() {
  return (
    <Layout className="NotFoundPage">
      <h1>Page Not Found</h1>
      
      <Link to="/posts">See All Posts</Link>
    </Layout>
  );
}
