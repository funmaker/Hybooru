import React from "react";
import Layout from "../components/Layout";
import Pagination from "../components/Pagination";


export default function TestPage() {
  return (
    <Layout>
      <Pagination count={1} />
      <Pagination count={2} />
      <Pagination count={3} />
      <Pagination count={4} />
      <Pagination count={5} />
      <Pagination count={6} />
      <Pagination count={7} />
      <Pagination count={8} />
      <Pagination count={9} />
      <Pagination count={10} />
      <Pagination count={11} />
      <Pagination count={12} />
      <Pagination count={13} />
    </Layout>
  );
}
