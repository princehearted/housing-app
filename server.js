import "dotenv/config"
import os from "os"
import app from "./app.js"

const PORT = process.env.PORT || 5000
const HOST = process.env.HOST || "0.0.0.0"

const getLocalIp = () => {
  const interfaces = os.networkInterfaces()

  for (const key of Object.keys(interfaces)) {
    for (const net of interfaces[key] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address
      }
    }
  }

  return null
}

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://localhost:${PORT}`)

  const localIp = getLocalIp()
  if (localIp) {
    console.log(`Server running on local network: http://${localIp}:${PORT}`)
  }
})
