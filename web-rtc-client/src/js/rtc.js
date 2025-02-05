import { sendToSignalingServer } from "./signalingClient";

let _localStream;
let _localClientId;
let _incomingOffer;
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
  closePeerConnection();
  remoteEndCall();
}

export function remoteEndCall(remoteClientId) {
  sendToSignalingServer({
    type: "end",
    remoteClientId: remoteClientId,
  });
}

export function cancelCall() {
  closePeerConnection();
  remoteCancelCall();
}

export function remoteCancelCall(remoteClientId) {
  sendToSignalingServer({
    type: "cancel_call",
    remoteClientId: remoteClientId,
  });
}

export function closePeerConnection() {
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

export function setRemoteConnectionReady(remoteClientId) {
  _remoteConnectionReady = true;
  pendingCandidates.forEach((candidate) => {
    sendToSignalingServer({
      type: "iceCandidate",
      remoteClientId: remoteClientId,
      candidate: candidate,
    });
  });
  pendingCandidates.clear();
}

function createPeerConnection(remoteClientId) {
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
  ];

  _peerConnection = new RTCPeerConnection({ iceServers });

  sendToSignalingServer({
    type: "remote_connection_ready",
    remoteClientId: remoteClientId,
  });

  _localStream
    .getTracks()
    .forEach((track) => _peerConnection.addTrack(track, _localStream));

  refreshAudioStream();
  refreshVideoStream();

  _peerConnection.ontrack = (event) => {
    const customEvent = new CustomEvent("remote-track-received", {
      detail: event,
    });

    document.dispatchEvent(customEvent);
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
        remoteClientId: remoteClientId,
        candidate: event.candidate,
      });
    }
  };
}

/* caller functions */

export async function initiateCall(remoteClientId, videoDeviceId) {
  try {
    await attachLocalStream(videoDeviceId);
    createPeerConnection(remoteClientId);
    const offer = await _peerConnection.createOffer();
    await _peerConnection.setLocalDescription(offer);

    sendToSignalingServer({
      type: "offer",
      localClientId: _localClientId,
      remoteClientId: remoteClientId,
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

export function setIncomingCall(offer) {
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

export async function acceptCall(videoDeviceId, remoteClientId) {
  await attachLocalStream(videoDeviceId);

  createPeerConnection(remoteClientId);

  _peerConnection.setRemoteDescription(_incomingOffer);

  const answer = await _peerConnection.createAnswer();
  await _peerConnection.setLocalDescription(answer);

  sendToSignalingServer({
    type: "answer",
    remoteClientId: remoteClientId,
    answer: _peerConnection.localDescription,
  });

  const event = new CustomEvent("call-acknowledged", {
    details: {
      remoteClientId: remoteClientId,
    },
  });

  document.dispatchEvent(event);
}

let isMuted = false;
let cameraDisabled = false;

export function toggleAudio() {
  isMuted = !isMuted;
  refreshAudioStream();
}

export function refreshAudioStream() {
  if (_localStream) {
    _localStream.getTracks().forEach((track) => {
      if (track.kind === "audio") {
        track.enabled = !isMuted;
      }
    });
  }
}

export function getIsMuted() {
  return isMuted;
}

export function getCameraDisabled() {
  return cameraDisabled;
}

export function toggleCamera() {
  cameraDisabled = !cameraDisabled;
  refreshVideoStream();
}

export function refreshVideoStream() {
  if (_localStream) {
    _localStream.getTracks().forEach((track) => {
      if (track.kind === "video") {
        track.enabled = !cameraDisabled;
      }
    });
  }
}
