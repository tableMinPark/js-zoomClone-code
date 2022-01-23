const messageList = document.querySelector("ul");
const nicknameForm = document.querySelector("#nickname")
const messageForm = document.querySelector("#message");

// socket : 연결을 위한 서버의 소켓
const socket = new WebSocket(`ws://${window.location.host}`);

function makeMessage(type, payload){
    const msg = {type, payload};
    return JSON.stringify(msg);
}

// 서버로의 연결이 열렸을 때 이벤트 
socket.addEventListener("open", () => {
    console.log("Connected to Server ✅");
});

// 서버로부터의 메시지가 수신되었을 때 이벤트
socket.addEventListener("message", (message) => {
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.appendChild(li);
});

// 서버로의 연결이 닫혔을 때 이벤트
socket.addEventListener("close", () => {    
    console.log("Disconnected to Server ❌");
});

function handleNickSubmit(event){    
    event.preventDefault();
    const input = nicknameForm.querySelector("input");
    socket.send(makeMessage("nickname", input.value));
    input.value = "";
}

function handleMessageSubmit(event){
    event.preventDefault();
    const input = messageForm.querySelector("input");

    // 서버로의 메시지 전송
    socket.send(makeMessage("new_message", input.value));
    const li = document.createElement("li");
    li.innerText = `You: ${input.value}`;
    messageList.appendChild(li);
    input.value = "";
}

nicknameForm.addEventListener("submit", handleNickSubmit)
messageForm.addEventListener("submit", handleMessageSubmit);

/**
{
    type:"nickname",
    payload:"sangmin"
}
{
    type:"new_message",
    payload:"hello everyone"
}
 */