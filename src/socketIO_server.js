import http from "http";
import { Server } from "socket.io";                 // admin Panel 설정
import { instrument } from "@socket.io/admin-ui";   // admin Panel 설정
import express from "express";

const app = express();

app.set("view engine", "pug");                              // view 엔진을 pug 로 지정
app.set("views", __dirname + "/views");                     // view 파일 폴더 지정 
app.use("/public", express.static(__dirname + "/public"));  // 유저가 /public 폴더에 접근할 수 있도록 허용

app.get("/", (req, res) => res.render("socketIO_home"));             // '/' 로 들어오는 get 요청을 home.pug 로 연결
app.get("/*", (req, res) => res.redirect("socketIO_home"));          // '/' 로 시작하는 모든 요청들을 home.pug 로 리다이렉트

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const httpServer = http.createServer(app);          // http server 생성
const wsServer = new Server(httpServer, {
    // admin Panel 설정 (https://admin.socket.io -> http://localhost:3000/admin)
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    }
});              // socket.io server 생성

// admin Panel 설정
instrument(wsServer, {
    auth: false,
});

// public room 을 찾는 함수 (rooms 에는 존재하지 않지만 sids 에는 존재하는 room을 찾아야함 : 각 socket 들은 private room 이 있기 때문)
function publicRooms(){
    const {
        sockets: {
            adapter : { sids, rooms },
        },
    } = wsServer;           // wsServer 의 sockets - adapter 안의 sids 와 rooms 를 상수처럼 사용할 수 있도록 함
    const publicRooms = [];
    rooms.forEach((_, key) => {                 // 위에서 선언한 rooms
        if (sids.get(key) === undefined){       // 위에서 선언한 sids
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

function countRoom(roomName){
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", socket => {
    socket["nickname"] = "Anon";

    // socket 의 모든 이벤트가 발생하면 실행됨 (socket.onAny(funcion))
    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`);
    });

    // 채팅방에 접속하는 이벤트
    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName);                          // socket group 생성 (채팅방생성)
        done();                                         // frontend 에 있는 showRoom() 함수를 실행시키는 버튼을 누름
        socket.to(roomName).emit("welcome", socket["nickname"], countRoom(roomName));            // 채팅방에서 접속한 브라우저를 제외한 다른 모든 접속자들에게 메시지를 보냄 (socket.to([채팅방이름]).emit([이벤트명]);
        
        wsServer.sockets.emit("room_change", publicRooms());
    });

    // 끊기기 직전에 실행되는 이벤트
    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1));
    });
    
    // 끊긴 후에 실행되는 이벤트
    socket.on("disconnect", () => {        
        wsServer.sockets.emit("room_change", publicRooms());
    });

    // backend 에서 동작하는 new_message 이벤트
    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    });

    socket.on("nickname", (nickname) => {socket["nickname"] = nickname});
});

httpServer.listen(3000, handleListen);

/*
// console.log(wsServer.sockets.adapter);

rooms: Map(3) {
    '9iNawbgDaOGgMM3UAAAE' => Set(1) { '9iNawbgDaOGgMM3UAAAE' },
    'UWOF398Cc-4veTeCAAAG' => Set(1) { 'UWOF398Cc-4veTeCAAAG' },
    '12' => Set(2) { '9iNawbgDaOGgMM3UAAAE', 'UWOF398Cc-4veTeCAAAG' }
},
sids: Map(2) {
    '9iNawbgDaOGgMM3UAAAE' => Set(2) { '9iNawbgDaOGgMM3UAAAE', '12' },
    'UWOF398Cc-4veTeCAAAG' => Set(2) { 'UWOF398Cc-4veTeCAAAG', '12' }
},

// 각 소켓들은 자신만의 private room 이 있음 (비공개 room) : rooms 를 보면 각 소켓들의 아이디가 room 의 이름으로 되어있음
// rooms 의 요소들은 2개의 소켓에 대한 2개의 private room + 12 라는 이름을 가진 public room 이 존재함
// sids (socket ID s) : 각 소켓의 아이디를 가지고 있고 현재 어디의 채팅방에 접속중인지 알 수 있음
 */