require('dotenv').config();
const express = require('express')
const cors = require("cors");
const http = require("http");
const socketIO = require("socket.io");
const magicNum = require('./games/magicNumber');
const app = express()
const server = http.createServer(app)

let port = process.env.PORT || 8080

const io = socketIO(server,{ cors : true, origin: '*'})


app.use(cors())

app.get('/', (request, response) => {
  response.json({ info: 'Cross pwgame API' })
})

// app.get('games/magicNumber', (req,res)=>{
//   res. da
// })

let rooms = []

io.on("connection", (socket) =>{
  console.log(`New client connected, User connected: ${socket.id}`);

  socket.on('playerData',(player) =>{
    console.log(`playerData: ${player.username}`);
    let room = null;

    if(!player.roomId){
      room = createRoom(player)
      console.log(`Room created : ${room.id} - ${player.username}`);
    } else {
      room = rooms.find(r => r.id === player.roomId)

      if (room === undefined){
        return;
      }

      room.players.push(player)
    }
    socket.join(room.id)

    io.to(socket.id).emit('join room',room.id)

    if (room.players.length > 1){
      io.to(room.id).emit('start game',room.players)
    }
  })

  socket.on('get rooms',() =>{
    io.to(socket.id).emit('list rooms', rooms)
  })

  //magicNum.initGame(io,socket)

  socket.on("disconnect", () => {
      console.log("Client disconnected");
      let rooms =null;

      rooms.forEach(r => {
        r.players.forEach(p => {
          if(p.socketId === socket.id && p.host){
            room = r
            rooms = rooms.filter(r => r !== room)
          }
        })
      });
    });
  })

function createRoom(player) {
    const room = { id: roomId(), players: [] };

    player.roomId = room.id;

    room.players.push(player);
    rooms.push(room);

    return room;
}

function roomId() {
    return Math.random().toString(36).substr(2, 9);
}

server.listen(port, () => {
  console.log(`App running on port ${port}.`)
})