const socket = io();

const myFace = document.querySelector("#myFace");
const muteBtn = document.querySelector("#mute");
const cameraBtn = document.querySelector("#camera");
const camerasSelect = document.querySelector("#cameras");

const welcome = document.querySelector("#welcome");
const call = document.querySelector("#call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if (currentCamera.label === camera.label){
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });
    } catch(e) {
        console.log(e);
    }
}

async function getMedia(deviceId) {
    const initialConstrains = {
        audio: true,
        video: { facingMode: "user" },
    };

    const cameraConstrains = {
        audio: true,
        video: { deviceId: { exact: deviceId } },
    };


    try {   
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstrains : initialConstrains
        );
        myFace.srcObject = myStream;

        handleMuteClick()       // 지워야함 (소리울려서 시작과 동시에 Mute)

        if (!deviceId){
            await getCameras();
        }
    } catch (e) {
        console.log(e);
    }
}

function handleMuteClick(){
    myStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if (!muted){
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}

function handleCameraClick(){
    myStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if (!cameraOff){
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    } else {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    }
}

async function handleCameraChange(){
    await getMedia(camerasSelect.value);
    if (myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
                            .getSenders()
                            .find(sender => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);


// Welcome Form (join a room)
const welcomeForm = welcome.querySelector("form");

async function initCall(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// chrome -> edge

// Socket Code
socket.on("welcome", async () => {                          // chrome
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", console.log);
    console.log("made data channel");
    const offer = await myPeerConnection.createOffer();     // chrome 의 offer 생성
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomName);
})

socket.on("offer", async (offer) => {                       // edge
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", console.log);
    });
    myPeerConnection.setRemoteDescription(offer);           // chrome 에서 생성된 offer 를 edge 에서 받음
    const answer = await myPeerConnection.createAnswer();   // chrome 으로 보낼 answer 생성
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {                           // chrome
    myPeerConnection.setRemoteDescription(answer);          // edge 에서 생성된 answer 를 chrome 에서 받음 (chrome - setRemoteDescription) 
});

socket.on("ice", ice => {
    myPeerConnection.addIceCandidate(ice);
});

/*
(chrome 이 채팅방 생성 -> edge 가 채팅방에 접속했다는 가정)
chrome  - Local     : offer
chrome  - Remote    : answer
edge    - Local     : answer
edge    - Remote    : offer     
*/

// RTC Code
function makeConnection(){
    myPeerConnection = new RTCPeerConnection({
        iceServers: [           // stun 서버설정 : 다른네트워크에 public IP 를 알려주기 위함
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ],
            },
        ],
    });
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data){
    socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data){
    const peerFace = document.querySelector("#peerFace");
    peerFace.srcObject = data.stream;
}