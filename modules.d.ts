
// Promise Websocket Fix
//
// declare module 'express-promise-router' {
//   import { RouterOptions } from 'express';
//   import { Router } from 'express-ws';
//
//   function PromiseRouter(options?: RouterOptions): Router;
//
//   export default PromiseRouter;
// }

declare module '*.handlebars' {
  export default function(template: any): string;
}
