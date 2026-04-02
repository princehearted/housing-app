const supabase = require("../supabaseClient")

exports.uploadFloorPlan = async (req, res) => {

  try {

    const file = req.file
    const unitTypeId = req.body.unitTypeId

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    if (!unitTypeId) {
      return res.status(400).json({ error: "unitTypeId required" })
    }

    const fileName = `${unitTypeId}/${Date.now()}-${file.originalname}`

    const { error } = await supabase.storage
      .from("unit-type-floor-plans")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype
      })

    if (error) throw error

    const fileUrl =
      `${process.env.SUPABASE_URL}/storage/v1/object/public/unit-type-floor-plans/${fileName}`

    res.json({
      message: "Floor plan uploaded successfully",
      floor_plan: fileUrl
    })

  } catch (err) {

    res.status(500).json({
      error: err.message
    })

  }

}