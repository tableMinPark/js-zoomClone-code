const socket = io();        // socket.io 를 브라우저에 설치

const welcome = document.querySelector("#welcome");
const form = welcome.querySelector("form");

function backendDone(msg){
    console.log("The backend say: ", msg);
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input = form.querySelector("input");

    // event 를 명시할 수 있고, Object를 전송할 수 있음
    // 보내는 데이터갯수의 제한이 없음
    socket.emit("enter_room", input.value, backendDone);        // emit 의 마지막에 오는 함수는 backend 에서 호출버튼을 누르고 실제로 실행되는 곳은 frontend 임       
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);