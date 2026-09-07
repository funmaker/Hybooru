import express from "express";
import type WebSocket from "ws";
import * as db from "../helpers/db";
import * as globalController from "../controllers/global";
import { WebSocketMessage } from "../../types/api";
import { registerWsRoute } from "./websockets";

export const router = express.Router();

export const connections = new Set<WebSocket>();

registerWsRoute("/progress", (ws, req) => {
  try {
    if(!db.dbLock.isLocked()) ws.close();
    if(db.dbLock.lastMessage) ws.send(JSON.stringify(db.dbLock.lastMessage));
    
    connections.add(ws);
  } catch(err) {
    console.error(err);
    
    connections.delete(ws);
    ws.close();
  }
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
