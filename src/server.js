import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");                              // view 엔진을 pug 로 지정
app.set("views", __dirname + "/views");                     // view 파일 폴더 지정 
app.use("/public", express.static(__dirname + "/public"));  // 유저가 /public 폴더에 접근할 수 있도록 허용

app.get("/", (req, res) => res.render("home"));             // '/' 로 들어오는 get 요청을 home.pug 로 연결
app.get("/*", (req, res) => res.redirect("home"));          // '/' 로 시작하는 모든 요청들을 home.pug 로 리다이렉트

const handleListen = () => console.log(`Listening on http://localhost:3000`);

const server = http.createServer(app);      // http server 생성
const wss = new WebSocket.Server({ server });         // web socket server 생성 후 http server 병합 (3000 port 로 http 와 web socket 을 둘다 구동할 때 필요)

// fake DB
const sockets = [];

// 서버와 연결된 각 브라우저들을 위한 코드
wss.on("connection", (socket) => {
    // socket : 서버에 연결된 브라우저의 소켓
    sockets.push(socket);
    socket["nickname"] = "Anon"

    // 브라우저와의 연결이 되었을 때 출력
    console.log("Connected to Browser ✅")

    // 브라우저와의 연결이 닫혔을 때 이벤트
    socket.on("close", () => {
        console.log("Disconnected to Browser ❌");
    });

    // 브라우저부터의 메시지가 수신되었을 때 이벤트
    socket.on("message", (msg) =>{
        const message = JSON.parse(msg);

        switch(message.type){
            case "new_message":
                sockets.forEach(aSocket => 
                    aSocket.send(`${socket.nickname}: ${message.payload}`)
                );
            case "nickname":
                socket["nickname"] = message.payload;
        }
    });
});

server.listen(3000, handleListen);