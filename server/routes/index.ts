import os from 'os';
import PromiseRouter from "express-promise-router";
import { IndexResponse } from "./apiTypes";

export const router = PromiseRouter();

router.get('/', (req, res) => {
  const initialData = {
    kek: `Welcome to Boilerplate 2.0 on ${os.hostname()}!`,
  };
  
  res.react<IndexResponse>(initialData);
});

