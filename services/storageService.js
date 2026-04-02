import supabase from "../config/supabaseClient.js"

const buildFilePath = (folderId, originalName) => {
  const safeName = originalName.replace(/\s+/g, "-")
  return `${folderId}/${Date.now()}-${safeName}`
}

export const uploadPublicFiles = async ({ bucket, folderId, files }) => {
  const urls = []

  for (const file of files) {
    const filePath = buildFilePath(folderId, file.originalname)

    const { error: uploadError } = await supabase
      .storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    const { data } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(filePath)

    urls.push(data.publicUrl)
  }

  return urls
}
