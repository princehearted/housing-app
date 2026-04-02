export default function requireRole(role) {
  return (req, res, next) => {

    const userRole = req.headers["x-user-role"]

    if (!userRole || userRole !== role) {
      return res.status(403).json({
        message: "Access denied"
      })
    }

    next()
  }
}