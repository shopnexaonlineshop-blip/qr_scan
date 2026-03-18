const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.redirect("/mobile.html");
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join-room", (roomId) => {
    if (!roomId) return;
    socket.join(roomId);
    socket.emit("joined-room", roomId);
    console.log(`${socket.id} joined room ${roomId}`);
  });

  socket.on("scanned-data", ({ roomId, text }) => {
    if (!roomId || !text) return;

    io.to(roomId).emit("receive-scanned-data", {
      text,
      time: Date.now()
    });

    console.log(`ROOM ${roomId}: ${text}`);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
