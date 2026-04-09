const app = require("../src/app");
const connectDB = require("../src/config/db");

module.exports = async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("API invocation failed:", error);
    return res.status(500).json({
      message: "Backend connection failed",
      details: error.message
    });
  }
};
