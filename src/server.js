import express from "express";

const app = express();

app.set("view engine", "pug");                              // view 엔진을 pug 로 지정
app.set("views", __dirname + "/views");                     // view 파일 폴더 지정 
app.use("/public", express.static(__dirname + "/public"));  // 유저가 /public 폴더에 접근할 수 있도록 허용

app.get("/", (req, res) => res.render("home"));             // '/' 로 들어오는 get 요청을 home.pug 로 연결
app.get("/*", (req, res) => res.redirect("home"));          // '/' 로 시작하는 모든 요청들을 home.pug 로 리다이렉트
const handleListen = () => console.log(`Listening on http://localhost:3000`);
app.listen(3000, handleListen);     // 3000 번 port 포트 오픈