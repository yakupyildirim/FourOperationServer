const { Subject } = require("rxjs");
const io = require("../io");
const uuid = require("uuidv4").default;
//const { clientToUsername } = require("./clientToUsername");
//const { clientToGameRoom } = require("./clientToGameRoom");

// TODO require lobby

const gameRooms = {};

//global.DEV_GLOBAL.gameRooms = gameRooms;

// pipe through updated rooms
const gameRoomSubject = new Subject();

// on first game hostId has first turn
const createGameRoom = ({ hostId, guestId }) => {
  const gameRoomId = uuid();
  
  var  level = Math.floor(Math.random() * 25) + 1;
  var  gameSize = 4; 

  const gameRoom = {
    gameRoomId,
    hostId,
    guestId,
    /*
    players: {
      [hostId]: { username: clientToUsername[hostId]},
      [guestId]: { username: clientToUsername[guestId] }
    },
    */
    level:level,
    gameSize:gameSize,
    gameResults: [],
    gameState: "NEW",
    rematch: {}
  };
  gameRoomSubject.next(gameRoom);

  //clientToGameRoom[hostId] = gameRoomId;
  //clientToGameRoom[guestId] = gameRoomId;
};

gameRoomSubject.subscribe(gameRoom => {
  if (["NEW"].indexOf(gameRoom.gameState > -1)) {
    gameRooms[gameRoom.gameRoomId] = gameRoom;
    emitGameRoom(gameRoom);
  }
});

const emitGameRoom = gameRoom => {
  io.to(gameRoom.hostId).emit("s2c-game-room", gameRoom);
  io.to(gameRoom.guestId).emit("s2c-game-room", gameRoom);
};

// const endGameRoom = gameRoomId => {};

const rematch = cid => {
  console.log("rematch", cid);
  const gameRoom = gameRooms[0/*clientToGameRoom[cid]*/];
  gameRoom.rematch[cid] = true;
  if (gameRoom.rematch[gameRoom.hostId] && gameRoom.rematch[gameRoom.guestId]) {
    // reset gameState
    gameRoom.rematch = {};
    gameRoom.level = level;
    gameRoom.gameSize = gameSize;
    gameRoom.gameState = "NEW";
    emitGameRoom(gameRoom);
  }
};

module.exports = { gameRooms, createGameRoom, rematch };
