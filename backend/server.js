const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.ADMIN_WEB_ORIGIN || "http://localhost:8080",
  })
);
app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/recycleDB")
.then(()=> console.log("MongoDB connected"))
.catch(err => console.log(err));

app.use("/api", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminAuthRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});