// socket : 연결을 위한 서버의 소켓
const socket = new WebSocket(`ws://${window.location.host}`);

// 서버로의 연결이 열렸을 때 이벤트 
socket.addEventListener("open", () => {
    console.log("Connected to Server ✅");
});

// 서버로부터의 메시지가 수신되었을 때 이벤트
socket.addEventListener("message", (message) => {
    console.log("New message: ", message.data, " from the server!");
});

// 서버로의 연결이 닫혔을 때 이벤트
socket.addEventListener("close", () => {    
    console.log("Disconnected to Server ❌");
});

// 서버로의 메시지 전송 (연결 후 5초후)
setTimeout(() => {
    socket.send("hello!");
}, 5000);