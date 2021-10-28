// TODO if dev env
global.DEV_GLOBAL = {};
const server = require("./server");
const io = require("./io");
const uuid = require("uuidv4").default;

var lobby = [];
var rooms = {};
  
const joinLobby = (socket, username) => {
  console.log('username geldi ' + username)
  if (lobby.filter(x=>x.id == socket.id).length == 0) {
    const user = {
      id :socket.id,
      username : username
    }
    lobby.push(user);
    console.log('lobby:' + lobby)
  }
  lobbyUsers();
};

const leaveLobby = cid => {
  lobby = lobby.filter(x => x.id !== cid);
  lobbyUsers();
};


const lobbyUsers = () =>{
  io.emit("s2c-lobby-users", lobby);
};


function createRoom(socket){
  var roomName = 'room-' + socket.id;
  const room = {
    id:uuid(),
    name: roomName,
    hostId : socket.id,
    sockets: [],
    winnerId: null
  };
  rooms[room.id] = room;
  socket.join(roomName)
  console.log('socket:' + socket.id +' joined room-' + socket.id)

  return room.id;

  //joinRoom(socket, room)
};

/*
const joinRoom = (socket, room) =>{
  room.sockets.push(socket);

  socket.join(room.id, ()=> {
    socket.roomId = room.id;
    console.log(socket.id, "Joined:", room.id);
  });
  console.log('joinRoom çıktı:');

}
*/

const leaveRooms = (socket) => {
  const roomsToDelete = [];
  for (const id in rooms) {
    const room = rooms[id];
    // check to see if the socket is in the current room
    if (room.sockets.includes(socket)) {
      socket.leave(id);
      // remove the socket from the room object
      room.sockets = room.sockets.filter((item) => item !== socket);
    }
    // Prepare to delete any rooms that are now empty
    if (room.sockets.length == 0) {
      roomsToDelete.push(room);
    }
  }

  // Delete all the empty rooms that we found earlier
  for (const room of roomsToDelete) {
    delete rooms[room.id];
  }
};

io.on("connection", socket => {
  console.log('user connected' + socket.id)

/*
  socket.on('joinRoom', (roomId)=>{
    const room = rooms[roomId];
    joinRoom(socket, room);
    //callback();
  });
*/

  socket.on('leaveRoom', ()=>{
    leaveRooms(socket);
  })

  socket.on("c2s-enter-lobby", username => {
    console.log("c2s-enter-lobby" + username)
    joinLobby(socket, username);
  });

  socket.on("c2s-leave-lobby", cid => {
    console.log("c2s-leave-lobby" + cid)
    leaveLobby(cid);
  });

  socket.on("disconnect", () => {
    // remove from lobby

    //leaveLobby(socket.id);
    // remove from clientToUsername
    //console.log('disconnect remove from clientToUsername' + socket.id)
    //delete clientToUsername[socket.id];

    leaveRooms(socket);
    // TODO remove from gameRooms, and emit s2c-game-end-by-disconnect
    // clientToGameRoom
  });

  socket.on("c2s-send-invite", ({ guestId }) => {
    console.log("TCL: guestId", guestId);

    var createdRoom = createRoom(socket);
    // send the user object
    io.to(guestId).emit("s2c-receive-invite", {
      hostId: socket.id,
      hostUsername: lobby.filter(x=>x.id == socket.id).map(m=>m.username),
      roomId: createdRoom
    });

  });

  socket.on("c2s-invite-accepted", ({ hostId, roomId }) => {
    console.log('c2s-invite-accepted:')

    console.log('roomId:' + roomId);

    //const roomsx = io.of("/").adapter.rooms;
    var room = rooms[roomId];

    leaveLobby(hostId);
    leaveLobby(socket.id);

    socket.join('room-' + hostId);

    //joinRoom(socket, room );

    io.to(hostId).emit("s2c-game-room", room);
    io.to(socket.id).emit("s2c-game-room", room);
    
  });


  socket.on("s2c-game-room", ({ room }) => {
    io.to(hostId).emit("s2c-game-room", room);
    io.to(socket.id).emit("s2c-game-room", room);
  });
 

  socket.on("c2s-rematch", () => {
    rematch(socket.id);
  });


});

console.log("am i running");

port = process.env.PORT || 3000


console.log(port);

server.listen(port);

const socket  =  io.listen(server);

socket.on("connect", (socket)=>{
  console.log("başarılı");
})