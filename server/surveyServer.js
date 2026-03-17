import WebSocket, { WebSocketServer } from "ws";

const port = process.env.PORT || 3000;

const wss = new WebSocketServer({ port });

console.log("WebSocket server running on port", port);

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Example: send dummy survey point every 3 sec
  const interval = setInterval(() => {
    const point = `${Math.random()*100},${Math.random()*100},${Math.random()*50}`;
    ws.send(point);
  }, 3000);

  ws.on("close", () => {
    clearInterval(interval);
    console.log("Client disconnected");
  });
});