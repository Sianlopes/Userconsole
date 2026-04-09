function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed",
      errors: Object.values(error.errors).map((item) => item.message)
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      message: "Duplicate value error",
      fields: error.keyValue
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid user id" });
  }

  if (error.name === "MongoServerError" && error.message.toLowerCase().includes("text index required")) {
    return res.status(400).json({
      message: "Bio text search is unavailable because the text index is not ready yet"
    });
  }

  if (error.name === "MongooseServerSelectionError") {
    return res.status(503).json({
      message: "Database is unreachable. Check MongoDB Atlas connection and network access."
    });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
}

module.exports = errorHandler;
