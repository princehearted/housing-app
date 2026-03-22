import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"

import authRoutes from "./routes/authRoutes.js"
import landlordRoutes from "./routes/landlordRoutes.js"
import tenantRoutes from "./routes/tenantRoutes.js"
import propertyRoutes from "./routes/propertyRoutes.js"
import bookingRoutes from "./routes/bookingRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"
import uploadRoutes from "./routes/uploadRoutes.js"
import platformContractRoutes from "./routes/platformContractRoutes.js"
import commissionRoutes from "./routes/commissionRoutes.js"
import complianceRoutes from "./routes/complianceRoutes.js"
import interestRoutes from "./routes/interestRoutes.js"
import { errorHandler, notFound } from "./middleware/errorMiddleware.js"

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(cors())
app.use(express.json())
app.use("/ui", express.static(path.join(__dirname, "frontend")))

app.get("/", (req, res) => {
  res.send("Rental platform backend running")
})

app.use("/api/auth", authRoutes)
app.use("/api/landlord", landlordRoutes)
app.use("/api/tenant", tenantRoutes)
app.use("/api", propertyRoutes)
app.use("/api", bookingRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api", platformContractRoutes)
app.use("/api", commissionRoutes)
app.use("/api", complianceRoutes)
app.use("/api", interestRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
