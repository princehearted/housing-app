import multer from "multer"

export const notFound = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.originalUrl}` })
}

export const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      if (["photos", "id_front", "id_back"].includes(err.field)) {
        return res.status(400).json({ error: "File too large. Maximum size is 5MB for images." })
      }

      return res.status(400).json({ error: "File too large. Maximum size is 10MB for documents." })
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ error: "Too many files uploaded for this request." })
    }

    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({ error: "Unexpected file field or too many files for one field." })
    }

    return res.status(400).json({ error: err.message })
  }

  if (err?.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({ error: err.message })
  }

  const statusCode = res.statusCode >= 400 ? res.statusCode : 500
  return res.status(statusCode).json({ error: err.message || "Internal server error" })
}

