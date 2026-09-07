import * as expressCore from "express-serve-static-core";

declare module "express-serve-static-core" {
  export interface RequestEx<P, ResBody, ReqData> extends expressCore.Request<P, ResBody, any, any, any> {
    body: ReqData;
  }
  
  export interface ResponseEx<ResBody> extends expressCore.Response<ResBody, any, any> {}
  
  export interface RequestHandlerEx<
    P = expressCore.ParamsDictionary,
    ResBody = any,
    ReqData = any,
  > {
    (
      req: RequestEx<P, ResBody, ReqData>,
      res: ResponseEx<ResBody>,
      next: expressCore.NextFunction,
    ): void | Promise<void>;
  }
  
  export interface ErrorRequestHandlerEx<
    P = expressCore.ParamsDictionary,
    ResBody = any,
    ReqData = any,
  > {
    (
      err: any,
      req: RequestEx<P, ResBody, ReqData>,
      res: ResponseEx<ResBody>,
      next: expressCore.NextFunction,
    ): void | Promise<void>;
  }
  
  export interface IRouterMatcher<T> {
    <P, ResBody, ReqData = never>(handler: ErrorRequestHandlerEx<P, ResBody, ReqData>): T;
    <P, ResBody, ReqData = never>(...middlewares: Array<RequestHandlerEx<P, ResBody, ReqData>>): T;
    <P, ResBody, ReqData = never>(p: string, ...middlewares: Array<RequestHandlerEx<P, ResBody, ReqData>>): T;
    <P, ResBody, ReqData = never>(p: string[], ...middlewares: Array<RequestHandlerEx<P, ResBody, ReqData>>): T;
  }
}

declare module 'express-session' {
  interface SessionData {}
}
