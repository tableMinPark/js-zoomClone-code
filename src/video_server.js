import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("video_home"));
app.get("/*", (req, res) => res.redirect("video_home"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", socket => {
    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome");                // chrome 에서는 발생되지 않고 edge 로 접속 시 chrome 에서 welcome 이벤트 발생
    });

    socket.on("offer", (offer, roomName) => {               // chrome 에서 생성한 offer 를 edge 로 전달
        socket.to(roomName).emit("offer", offer);
    });

    socket.on("answer", (answer, roomName) => {             // edge 에서 생성한 answer 를 chrome 으로 전달
        socket.to(roomName).emit("answer", answer);
    });

    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    });
});

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);