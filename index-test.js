require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const User = require("./src/models/User");

async function seedUsers() {
  const sampleUsers = [
    {
      name: "Alice Thomas",
      email: "alice@example.com",
      age: 22,
      hobbies: ["reading", "travel", "music"],
      bio: "Enjoys reading books and writing travel blogs.",
      userId: "user-alice-001"
    },
    {
      name: "Brian Dsouza",
      email: "brian@example.com",
      age: 25,
      hobbies: ["photography", "music"],
      bio: "Photography enthusiast with interest in wildlife.",
      userId: "user-brian-002"
    },
    {
      name: "Carla Fernandes",
      email: "carla@example.com",
      age: 21,
      hobbies: ["coding", "chess", "music"],
      bio: "Loves coding side projects and exploring backend systems.",
      userId: "user-carla-003"
    }
  ];

  await User.deleteMany({ email: { $in: sampleUsers.map((user) => user.email) } });
  await User.insertMany(sampleUsers, { ordered: true });
}

async function showIndexes() {
  const indexes = await User.collection.indexes();
  console.log("Indexes:");
  console.table(indexes.map((index) => ({ name: index.name, key: JSON.stringify(index.key) })));
}

async function explainQueries() {
  const nameExplain = await User.find({ name: "Alice Thomas" }).explain("executionStats");
  const compoundExplain = await User.find({ email: "carla@example.com", age: 21 }).explain("executionStats");
  const hobbyExplain = await User.find({ hobbies: "music" }).explain("executionStats");
  const textExplain = await User.find({ $text: { $search: "backend travel" } }).explain("executionStats");

  const reports = [
    { label: "Single field index on name", data: nameExplain },
    { label: "Compound index on email and age", data: compoundExplain },
    { label: "Multikey index on hobbies", data: hobbyExplain },
    { label: "Text index on bio", data: textExplain }
  ];

  for (const report of reports) {
    console.log(`\n${report.label}`);
    console.log("Winning plan stage:", report.data.queryPlanner.winningPlan.stage || report.data.queryPlanner.winningPlan.queryPlan?.stage);
    console.log("Keys examined:", report.data.executionStats.totalKeysExamined);
    console.log("Documents examined:", report.data.executionStats.totalDocsExamined);
    console.log("Execution time (ms):", report.data.executionStats.executionTimeMillis);
  }
}

async function run() {
  try {
    await connectDB();
    await User.syncIndexes();
    await seedUsers();
    await showIndexes();
    await explainQueries();
  } catch (error) {
    console.error("Index test failed:", error);
  } finally {
    await mongoose.connection.close();
  }
}

run();
