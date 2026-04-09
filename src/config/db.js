const dns = require("dns");
const mongoose = require("mongoose");
require("../models/User");

let cachedConnection = null;
let indexesSynced = false;

function configureDns() {
  const dnsServers = process.env.DNS_SERVERS
    ? process.env.DNS_SERVERS.split(",").map((server) => server.trim()).filter(Boolean)
    : ["8.8.8.8", "1.1.1.1"];

  try {
    dns.setServers(dnsServers);
  } catch (error) {
    console.warn("Could not apply custom DNS servers:", error.message);
  }
}

async function connectDB() {
  try {
    if (cachedConnection) {
      return cachedConnection;
    }

    const mongoUri = process.env.MONGODB_URI_FALLBACK || process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set in .env");
    }

    configureDns();

    cachedConnection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    });
    if (!indexesSynced) {
      await mongoose.syncIndexes();
      indexesSynced = true;
      console.log("MongoDB indexes synced");
    }
    console.log("MongoDB connected");
    return cachedConnection;
  } catch (error) {
    cachedConnection = null;
    console.error("MongoDB connection failed:", error.message);
    if (error.message.includes("querySrv")) {
      console.error("Atlas SRV lookup failed. Set MONGODB_URI_FALLBACK to the non-SRV Atlas URI from Atlas > Connect > Drivers.");
    }
    process.exit(1);
  }
}

module.exports = connectDB;
