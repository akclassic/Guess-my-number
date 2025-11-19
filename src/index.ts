import index from "./index.html";
import type { ServerWebSocket } from "bun";
import { Matchmaker } from "./game/Matchmaker";
import type { ClientMessage } from "./types/messages";

const matchmaker = new Matchmaker();

const server = Bun.serve({
  port: 3001,
  fetch(req, server) {
    if (server.upgrade(req)) {
      return;
    }

    return new Response("Guess the number websocket server", { status: 200 });
  },
  websocket: {
    open(ws: ServerWebSocket<any>) {
      console.log("Client connected");

      ws.data = {};
    },

    message(ws: ServerWebSocket<any>, message: string) {
      let parsed: ClientMessage;
      try {
        parsed = JSON.parse(message.toString());
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
        return;
      }

      switch (parsed.type) {
        case "join_matchmaking": {
          const name = parsed.name?.trim();
          if (!name) {
            ws.send(JSON.stringify({ type: "error", message: "Name is required" }));
            return;
          }

          matchmaker.addPlayer(ws, name, parsed.mode);
          break;
        }
        case "submit_secret": {
          const room = matchmaker.getRoom(ws.data.roomId);
          if (!room) {
            ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
            return;
          }
          const playerId = ws.data.playerId;
          if (!playerId) {
            ws.send(JSON.stringify({ type: "error", message: "Unknown player" }));
            return;
          }
          room.setSecret(playerId, parsed.secret);
          break;
        }
        case "make_guess": {
          const room = matchmaker.getRoom(ws.data.roomId);
          if (!room) {
            ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
            return;
          }
          const playerId = ws.data.playerId;
          if (!playerId) {
            ws.send(JSON.stringify({ type: "error", message: "Unknown player" }));
            return;
          }
          room.handleGuess(playerId, parsed.guess);
          break;
        }
        case "leave_matchmaking":
          ws.close();
          break;
        case "ping":
          ws.send(JSON.stringify({ type: "pong" }));
          break;
        default:
          ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
      }
    },

    close(ws: ServerWebSocket<any>){
      console.log("Client disconnected");
      matchmaker.handleDisconnect(ws);
    },

    // error(ws: ServerWebSocket<any>, error: Error) {
    //   console.error("WebSocket error:", error);
    //   ws.close();
    // }
  }
});

console.log("WebSocket server started on ws://localhost:3001");
// const server = serve({
//   routes: {
//     // Serve index.html for all unmatched routes.
//     "/*": index,

//     "/api/hello": {
//       async GET(req) {
//         return Response.json({
//           message: "Hello, world!",
//           method: "GET",
//         });
//       },
//       async PUT(req) {
//         return Response.json({
//           message: "Hello, world!",
//           method: "PUT",
//         });
//       },
//     },

//     "/api/hello/:name": async req => {
//       const name = req.params.name;
//       return Response.json({
//         message: `Hello, ${name}!`,
//       });
//     },
//   },

//   development: process.env.NODE_ENV !== "production" && {
//     // Enable browser hot reloading in development
//     hmr: true,

//     // Echo console logs from the browser to the server
//     console: true,
//   },
// });

// console.log(`🚀 Server running at ${server.url}`);
