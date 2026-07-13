import PromiseRouter from "express-promise-router";
import type WebSocket from "ws";
import * as db from "../helpers/db";
import * as globalController from "../controllers/global";
import { WebSocketMessage } from "./apiTypes";

export const router = PromiseRouter();

export const connections = new Set<WebSocket>();

// Avoids express-ws initialization race condition
setImmediate(() => {
  router.ws("/progress", (ws, req) => {
    try {
      console.log("Got connection from: ", req.socket.remoteAddress);
      if(!db.dbLock.isLocked()) ws.close();
      if(db.dbLock.lastMessage) ws.send(JSON.stringify(db.dbLock.lastMessage));
      
      console.log("Added to list");
      connections.add(ws);
    } catch(err) {
      console.error(err);
      
      connections.delete(ws);
      ws.close();
    }
  });
});

function sendMessage(ws: WebSocket, msg: WebSocketMessage) {
  try {
    ws.send(JSON.stringify(msg));
  } catch(err) {
    console.error(err);
    connections.delete(ws);
    ws.close();
  }
}

db.dbLock.on("progress", progress => {
  for(const ws of connections) {
    sendMessage(ws, {
      type: "progress",
      data: progress,
    });
  }
});

db.dbLock.on("end", async () => {
  const oldConnections = [...connections.values()];
  connections.clear();
  
  const config = await globalController.getConfig();
  
  for(const ws of oldConnections) {
    sendMessage(ws, {
      type: "end",
      data: config,
    });
    
    try {
      ws.close();
    } catch(err) {
      console.error(err);
    }
  }
});
