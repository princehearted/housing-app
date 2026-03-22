import multer from "multer"

const imageMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
]

const documentMimeTypes = [
  ...imageMimeTypes,
  "application/pdf"
]

const buildUploader = ({ mimeTypes, maxFileSizeBytes, maxFiles, allowedLabel }) => {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxFileSizeBytes,
      files: maxFiles
    },
    fileFilter: (req, file, cb) => {
      if (!mimeTypes.includes(file.mimetype)) {
        const error = new Error(`Unsupported file type for '${file.fieldname}'. Allowed: ${allowedLabel}`)
        error.code = "INVALID_FILE_TYPE"
        return cb(error)
      }

      cb(null, true)
    }
  })
}

export const upload = buildUploader({
  mimeTypes: imageMimeTypes,
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxFiles: 10,
  allowedLabel: "JPG, JPEG, PNG, WEBP"
})

export const uploadIdImages = buildUploader({
  mimeTypes: imageMimeTypes,
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxFiles: 2,
  allowedLabel: "JPG, JPEG, PNG, WEBP"
})

export const uploadDocument = buildUploader({
  mimeTypes: documentMimeTypes,
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxFiles: 1,
  allowedLabel: "JPG, JPEG, PNG, WEBP, PDF"
})
