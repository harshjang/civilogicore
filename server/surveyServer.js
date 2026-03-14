const WebSocket = require("ws")

const wss = new WebSocket.Server({ port: process.env.PORT || 8080 })

console.log("Survey WebSocket server running")

wss.on("connection", ws => {

  console.log("Client connected")

  ws.on("message", msg => {

    console.log("Incoming survey:", msg.toString())

    // broadcast to all connected clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg.toString())
      }
    })

  })

})