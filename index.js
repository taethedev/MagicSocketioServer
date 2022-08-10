const express = require('express');
require("dotenv").config();
const cors = require('cors')
const { Server } = require("socket.io");
const { createServer } = require("http");
const app = express();
const httpServer = createServer(app);
app.use(cors())
const io = new Server(httpServer, { 
  cors: {
    origin: process.env.CONNECT_FOUR_SOCKET_CLIENT_URL,
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

  socket.on('send-handle-drop', (param, room, playerTurn) => {
    let nextPlayer = playerTurn == 1 ? 2 : 1;
    io.to(room).emit('receive-handle-drop', param, playerTurn, nextPlayer);
    console.log('function received and sent')
  })
  socket.on('restart-game', (winner, room) => {
    console.log(winner)
    io.to(room).emit('restarting-game', winner);
  })

});
io.on('disconnect', (socket) => {
  console.log(`${socket.id} Disconnected`);
});

httpServer.listen(PORT, ()=> console.log(`Running on port ${PORT}`));
