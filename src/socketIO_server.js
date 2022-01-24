import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");                              // view 엔진을 pug 로 지정
app.set("views", __dirname + "/views");                     // view 파일 폴더 지정 
app.use("/public", express.static(__dirname + "/public"));  // 유저가 /public 폴더에 접근할 수 있도록 허용

app.get("/", (req, res) => res.render("socketIO_home"));             // '/' 로 들어오는 get 요청을 home.pug 로 연결
app.get("/*", (req, res) => res.redirect("socketIO_home"));          // '/' 로 시작하는 모든 요청들을 home.pug 로 리다이렉트

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const httpServer = http.createServer(app);          // http server 생성
const wsServer = SocketIO(httpServer);              // socket.io server 생성

wsServer.on("connection", socket => {
    // socket.on("enter_room", (msg, done) => {
    //     console.log(msg);       // 브라우저에서 정의한 enter_room event 가 발생할 때 실행됨
    //     setTimeout(() => {
    //         done();             // front 에서 정의한 함수를 호출함
    //     }, 5000);
    // });

    // socket 의 모든 이벤트가 발생하면 실행됨 (socket.onAny(funcion))
    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`);
    });

    socket["nickname"] = "Anon";

    // 채팅방에 접속하는 이벤트 
    socket.on("enter_room", (roomName, done) => {
        socket.join(roomName);                          // socket group 생성 (채팅방생성)
        done();                                         // frontend 에 있는 showRoom() 함수를 실행시키는 버튼을 누름
        socket.to(roomName).emit("welcome");            // 채팅방에서 접속한 브라우저를 제외한 다른 모든 접속자들에게 메시지를 보냄 (socket.to([채팅방이름]).emit([이벤트명]);
    });

    socket.on("disconnecting", () => {
        socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname));
    });

    // backend 에서 동작하는 new_message 이벤트
    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done();
    });

    socket.on("nickname", (nickname) => {socket["nickname"] = nickname});
});

httpServer.listen(3000, handleListen);