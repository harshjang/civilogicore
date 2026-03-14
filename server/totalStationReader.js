const SerialPort = require("serialport")

const port = new SerialPort("COM3", { baudRate:9600 })

port.on("data", data => {

 const line = data.toString()

 console.log(line)

})