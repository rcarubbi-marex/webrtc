import {
  remoteVideo,
  targetIdInput,
  startCallButton,
  endCallButton,
} from "./uiControls";
import { sendToSignalingServer } from "./signalingClient";

let _localStream;
let _incomingOffer;
let _remoteClientId;
let _localClientId;
let _peerConnection;
let _remoteConnectionReady = false;

export async function getVideoDevices() {
  await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

  const videoDevices = (await navigator.mediaDevices.enumerateDevices()).filter(
    (device) => device.kind === "videoinput"
  );

  return videoDevices;
}

export function setLocalClientId(id) {
  _localClientId = id;
}

export function setIncomingCandidate(candidate) {
  _peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

export function endCall() {
  localEndCall();
  remoteEndCall();
}

export function remoteEndCall() {
  sendToSignalingServer({
    type: "end",
    remoteClientId: _remoteClientId,
  });
}

export function cancelCall() {
  localEndCall();
  remoteCancelCall();
}

export function remoteCancelCall() {
  sendToSignalingServer({
    type: "cancel_call",
    remoteClientId: _remoteClientId,
  });
}

export function localEndCall() {
  if (_localStream) {
    detachLocalStream();
  }

  if (_peerConnection) {
    _peerConnection.close();
    _peerConnection = null;
  }

  startCallButton.disabled = false;
  endCallButton.disabled = true;
}

async function attachLocalStream(videoDeviceId) {
  _localStream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: videoDeviceId },
    audio: true,
  });
  localVideo.srcObject = _localStream;
}

function detachLocalStream() {
  _localStream.getTracks().forEach((track) => track.stop());
  localVideo.srcObject = null;
}

const pendingCandidates = new Set();

export function setRemoteConnectionReady() {
  _remoteConnectionReady = true;
  pendingCandidates.forEach((candidate) => {
    sendToSignalingServer({
      type: "iceCandidate",
      remoteClientId: _remoteClientId,
      candidate: candidate,
    });
  });
  pendingCandidates.clear();
}

function createPeerConnection() {
  const iceServers = [
    {
      urls: "stun:stun.relay.metered.ca:80",
    },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "8813cbb5cb49c9cb4b9bb8f9",
      credential: "o21Qt9JBUu2r8KMP",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "8813cbb5cb49c9cb4b9bb8f9",
      credential: "o21Qt9JBUu2r8KMP",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "8813cbb5cb49c9cb4b9bb8f9",
      credential: "o21Qt9JBUu2r8KMP",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "8813cbb5cb49c9cb4b9bb8f9",
      credential: "o21Qt9JBUu2r8KMP",
    },

    // { url: "stun:stun.l.google.com:19302" },
    // { url: "stun:stun1.l.google.com:19302" },
    // { url: "stun:stun2.l.google.com:19302" },
    // { url: "stun:stun3.l.google.com:19302" },
    // {
    //   url: "turn:numb.viagenie.ca",
    //   credential: "muazkh",
    //   username: "webrtc@live.com",
    // },
    // {
    //   url: "turn:relay.backups.cz",
    //   credential: "webrtc",
    //   username: "webrtc",
    // },
    // {
    //   url: "turn:relay.backups.cz?transport=tcp",
    //   credential: "webrtc",
    //   username: "webrtc",
    // },
    // {
    //   url: "turn:192.158.29.39:3478?transport=udp",
    //   credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
    //   username: "28224511:1379330808",
    // },
    // {
    //   url: "turn:192.158.29.39:3478?transport=tcp",
    //   credential: "JZEOEt2V3Qb0y27GRntt2u2PAYA=",
    //   username: "28224511:1379330808",
    // },
    // {
    //   url: "turn:turn.bistri.com:80",
    //   credential: "homeo",
    //   username: "homeo",
    // },
    // {
    //   url: "turn:turn.anyfirewall.com:443?transport=tcp",
    //   credential: "webrtc",
    //   username: "webrtc",
    // },
  ];

  _peerConnection = new RTCPeerConnection({ iceServers });

  sendToSignalingServer({
    type: "remote_connection_ready",
    remoteClientId: _remoteClientId,
  });

  _localStream
    .getTracks()
    .forEach((track) => _peerConnection.addTrack(track, _localStream));

  toggleCamera();
  toggleAudio();

  _peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  _peerConnection.onicecandidate = (event) => {
    if (!event.candidate) {
      return;
    }
    if (!_remoteConnectionReady) {
      pendingCandidates.add(event.candidate);
    } else {
      sendToSignalingServer({
        type: "iceCandidate",
        remoteClientId: _remoteClientId,
        candidate: event.candidate,
      });
    }
  };
}

/* caller functions */

export async function initiateCall(remoteClientId, videoDeviceId) {
  try {
    await attachLocalStream(videoDeviceId);
    _remoteClientId = remoteClientId;

    createPeerConnection();

    const offer = await _peerConnection.createOffer();
    await _peerConnection.setLocalDescription(offer);

    sendToSignalingServer({
      type: "offer",
      localClientId: _localClientId,
      remoteClientId: _remoteClientId,
      offer: _peerConnection.localDescription,
    });
  } catch (error) {
    console.error("Error during call initiation", error);
  }
}

export async function setAnswer(answer) {
  const remoteDesc = new RTCSessionDescription(answer);
  await _peerConnection.setRemoteDescription(remoteDesc);
}

/* receiver functions */

export function setIncomingCall(remoteClientId, offer) {
  _remoteClientId = remoteClientId;
  _incomingOffer = offer;
}

export function rejectCall() {
  sendToSignalingServer({
    type: "reject",
    remoteClientId: _remoteClientId,
  });

  _incomingOffer = null;
  _remoteClientId = null;
}

export async function acceptCall(videoDeviceId) {
  await attachLocalStream(videoDeviceId);

  createPeerConnection();

  _peerConnection.setRemoteDescription(_incomingOffer);

  const answer = await _peerConnection.createAnswer();
  await _peerConnection.setLocalDescription(answer);

  sendToSignalingServer({
    type: "answer",
    remoteClientId: _remoteClientId,
    answer: _peerConnection.localDescription,
  });

  targetIdInput.value = _remoteClientId;
}

let isMuted = false;
let cameraDisabled = false;

export function toggleAudio() {
  isMuted = !isMuted;
  _localStream.getTracks().forEach((track) => {
    if (track.kind === "audio") {
      track.enabled = isMuted;
    }
  });
}

export function toggleCamera() {
  cameraDisabled = !cameraDisabled;
  _localStream.getTracks().forEach((track) => {
    if (track.kind === "video") {
      track.enabled = cameraDisabled;
    }
  });
}
