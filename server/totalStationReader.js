const { SerialPort } = require("serialport")
const WebSocket = require("ws")

const port = new SerialPort({
  path: "COM3",
  baudRate: 9600
})

const wss = new WebSocket.Server({ port: 8080 })

port.on("data", data => {

  const line = data.toString()

  console.log("Survey:", line)

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(line)
    }
  })

})