const express = require('express');
require("dotenv").config();

const { Server } = require("socket.io");
const { createServer } = require("http");
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { 
  cors: {
    origin: [process.env.CONNECT_FOUR_SOCKET_CLIENT_URL],
    methods: ["GET", "POST"]
  }
 });

const PORT = process.env.PORT;

io.on('connection', (socket) => {
  console.log(`${socket.id} Connected`);

  socket.on('join-room', (room, cb) => {
    console.log(`Room: '${room}' received`);
    let rooms = io.of('/').adapter.rooms;
    let roomSize = rooms.get(room)? rooms.get(room).size : 0;

    if (roomSize == 0) {
      socket.join(room);
      cb({ 
        msg:'success',
        isHost: true
      });
    } else if (roomSize == 1) {
      socket.join(room);
      cb({ 
        msg:'success',
        isHost: false,
      });
      io.to(room).emit('game-ready');
    } else {
      cb({msg: 'full'});
    }
  });

  socket.on('turn-chosen', (turn) => {
    let opponentTurn = turn === 'first' ? 'second' : 'first';
    socket.broadcast.emit('set-turn', opponentTurn);
  })
  socket.on('send-message', (msg, room, nextTurn) => {
    io.to(room).emit('receive-text', msg, nextTurn);
  })
  

});
io.on('disconnect', (socket) => {
  console.log(`${socket.id} Disconnected`);
});

httpServer.listen(PORT, ()=> console.log(`Running on port ${PORT}`));
