import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import type { SSEEvent } from "../types.js";
import { renderBoard } from "../views/kanban.js";
import { renderLoopCard } from "../views/loop-card.js";
import { getLoop, getAllLoops } from "./state.js";

type SSEClient = {
  send: (event: string, data: string) => void;
  close: () => void;
};

const clients: Set<SSEClient> = new Set();

export function sseHandler(c: Context) {
  return streamSSE(c, async (stream) => {
    const client: SSEClient = {
      send: (event, data) => {
        stream.writeSSE({ event, data }).catch(() => {
          clients.delete(client);
        });
      },
      close: () => {
        clients.delete(client);
      },
    };
    clients.add(client);

    // Keep alive
    const keepAlive = setInterval(() => {
      stream.writeSSE({ event: "ping", data: "" }).catch(() => {
        clients.delete(client);
        clearInterval(keepAlive);
      });
    }, 15000);

    // Wait until disconnected
    stream.onAbort(() => {
      clients.delete(client);
      clearInterval(keepAlive);
    });

    // Keep the stream open
    await new Promise(() => {});
  });
}

export function broadcast(event: SSEEvent): void {
  let html: string;
  let eventName: string;

  switch (event.type) {
    case "loop-update": {
      const loop = getLoop(event.loopId);
      if (!loop) return;
      // Send full board update to move cards between columns
      html = renderBoard(getAllLoops());
      eventName = "board-update";
      break;
    }
    case "board-update": {
      html = renderBoard(getAllLoops());
      eventName = "board-update";
      break;
    }
    case "log-update": {
      const loop = getLoop(event.loopId);
      if (!loop) return;
      html = renderBoard(getAllLoops());
      eventName = "board-update";
      break;
    }
  }

  for (const client of clients) {
    try {
      client.send(eventName, html);
    } catch {
      clients.delete(client);
    }
  }
}
