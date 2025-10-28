import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"; 
import path from "path";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import streamRoutes from "./routes/stream.route.js"
import groupRoutes from "./routes/groupMessage.route.js";
import { app, server } from "./lib/socket.js"; 

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json({limit: "50mb"}))

app.use(express.urlencoded({extended: true, limit: "50mb"}))
app.use(express.static("public"))
app.use(cookieParser());

 


app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/stream", streamRoutes)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("🖥️ Server is running on PORT:" + PORT);
  connectDB();
});

 