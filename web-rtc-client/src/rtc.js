import { remoteVideo, targetIdInput } from "./uiControls";
import { sendToSignalingServer } from "./signalingClient";
 

let _localStream;
let _incomingOffer;
let _remoteClientId;
let _localClientId;
let _peerConnection;
let _remoteConnectionReady = false;
export const videoDevices = (
  await navigator.mediaDevices.enumerateDevices()
).filter((device) => device.kind === "videoinput");
export const defaultDeviceId = videoDevices[0].deviceId;

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
    { urls: "stun:stun.l.google.com:19302" },
    // { urls: "turn:your-turn-server", username: "user", credential: "pass" },
  ];

  _peerConnection = new RTCPeerConnection({ iceServers });

  sendToSignalingServer({
    type: "remote_connection_ready",
    remoteClientId: _remoteClientId,
  });

  _localStream
    .getTracks()
    .forEach((track) => _peerConnection.addTrack(track, _localStream));

  toggleCamera(isDisabled);
  toggleAudio(isMuted);

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

export function toggleAudio(isMuted) {
  _localStream.getTracks().forEach(track => {
   
    if (track.kind === 'audio') {
      track.enabled = !isMuted;
    }
  });
}

export function toggleCamera(isDisabled) {
  _localStream.getTracks().forEach(track => {
    if (track.kind === 'video') {
      track.enabled = !isDisabled;
    }
  });
}

