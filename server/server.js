const WebSocket = require("ws");

const port = process.env.PORT || 3000;

const server = new WebSocket.Server({ port });

console.log("WebSocket server running on port", port);

server.on("connection", (ws) => {
  console.log("Client connected");

  const interval = setInterval(() => {
    const point = `${Math.random()*100},${Math.random()*100},${Math.random()*50}`;
    ws.send(point);
  }, 3000);

  ws.on("close", () => {
    clearInterval(interval);
    console.log("Client disconnected");
  });
});