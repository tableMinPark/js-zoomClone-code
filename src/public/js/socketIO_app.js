const socket = io();        // socket.io 를 브라우저에 설치

const welcome = document.querySelector("#welcome");
const form = welcome.querySelector("form");
const room = document.querySelector("#room");

room.hidden = true;

let roomName;

function addMessage(message){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function handleNameSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#name input");
    socket.emit("nickname", input.value);
    input.value = "";
}

function handleMessageSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const value = input.value;
    socket.emit("new_message", value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";
}


function showRoom(msg){
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    
    const msgForm = room.querySelector("#msg");
    const nameForm = room.querySelector("#name");
    nameForm.addEventListener("submit", handleNameSubmit);
    msgForm.addEventListener("submit", handleMessageSubmit);
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input = form.querySelector("input");

    // event 를 명시할 수 있고, Object를 전송할 수 있음
    // 보내는 데이터갯수의 제한이 없음
    socket.emit("enter_room", input.value, showRoom);        // emit 의 마지막에 오는 함수는 backend 에서 호출버튼을 누르고 실제로 실행되는 곳은 frontend 임       
    roomName = input.value;
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

// 채팅방에 접속할 때마다 다른접속자들에게 알림을 주는 이벤트 (fronted에서 정의한 이벤트)
socket.on("welcome", (user) => {
    addMessage(`${user} joined!`);
});

socket.on("bye", (left) => {
    addMessage(`${left} left!`)
});

// fronted 에서 동작하는 new_message 이벤트
socket.on("new_message", addMessage);