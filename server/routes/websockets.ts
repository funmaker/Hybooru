import { IncomingMessage, STATUS_CODES } from "node:http";
import { Duplex } from "node:stream";
import { WebSocket, WebSocketServer } from "ws";
import HTTPError from "../helpers/HTTPError";

export type WsHandler = (ws: WebSocket, req: IncomingMessage) => void;

const handlers: Record<string, WsHandler> = {};

export function registerWsRoute(pathname: string, handler: WsHandler) {
  handlers[pathname] = handler;
}

export function onWsConnection(wss: WebSocketServer, request: IncomingMessage, soc: Duplex, head: NonSharedBuffer) {
  const url = typeof request.url === "string" && new URL(request.url);
  const handler = url && handlers[url.pathname];
  if(!handler) {
    abortHandshake(soc, 404, "Page Not Found");
    return;
  }
  
  wss.handleUpgrade(request, soc, head, ws => {
    try {
      handler(ws, request);
    } catch(err: any) {
      const message = err instanceof HTTPError ? err.message : "Internal Server Error";
      ws.close(1011, message);
    }
  });
}

function abortHandshake(socket: Duplex, code: number, message: string | null = null, headers: Record<string, string> = {}) {
  if(socket.writable) {
    message = message || STATUS_CODES[code] || "Something Happened";
    headers = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "Connection": 'close',
      "Content-type": 'text/html',
      "Content-Length": Buffer.byteLength(message).toString(),
      ...headers,
    };
    
    socket.write(
      `HTTP/1.1 ${code} ${STATUS_CODES[code]}\r\n`
      + Object.entries(headers)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\r\n')
      + '\r\n\r\n'
      + message,
    );
  }
  
  socket.destroy();
}
