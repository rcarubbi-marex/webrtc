import {
  setIncomingCall,
  setIncomingCandidate,
  setAnswer,
  closePeerConnection,
  setLocalClientId,
  setRemoteConnectionReady,
  initiateCall,
  endCall,
  acceptCall,
  rejectCall,
  getVideoDevices,
  toggleAudio,
  toggleCamera,
  cancelCall,
  getCameraDisabled,
  getIsMuted,
} from "./rtc";
import {
  sourceIdInput,
  incomingClientIdLabel,
  muteButton,
  cameraButton,
  endCallButton,
  startCallButton,
  targetIdInput,
  acceptCallButton,
  rejectCallButton,
  receivingCallModal,
  cancelCallButton,
  callingModal,
  modalElems,
  dropdownElems,
  videoDeviceSelectTrigger,
  videoDeviceSelect,
} from "./domElements";
import { playRinging, playStartCall, stopRinging, playEndCall } from "./fx";
import { connectToSignalingServer } from "./signalingClient.js";

startCallButton.addEventListener("click", async () => {
  const remoteClientId = targetIdInput.value.trim();

  if (!remoteClientId) {
    M.toast({
      html: "Please enter a valid client ID",
      classes: "rounded",
      displayLength: 2000,
    });
    return;
  }

  const instance = M.Modal.getInstance(callingModal);
  instance.open();
  playRinging();

  const videoDevicesDropdown = M.Dropdown.getInstance(videoDeviceSelectTrigger);
  const deviceId =
    videoDevicesDropdown.selectedItem?.dataset?.deviceId ||
    (await getVideoDevices())[0].deviceId;

  initiateCall(remoteClientId, deviceId);

  startCallButton.disabled = true;
  endCallButton.disabled = false;
});

muteButton.addEventListener("click", () => {
  const icon = muteButton.querySelector("i");
  toggleAudio();
  icon.innerHTML = !getIsMuted() ? "mic" : "mic_off";
});

cameraButton.addEventListener("click", () => {
  const icon = cameraButton.querySelector("i");
  toggleCamera();
  icon.innerHTML = !getCameraDisabled() ? "videocam" : "videocam_off";
});

endCallButton.addEventListener("click", () => {
  targetIdInput.value = "";
  endCall();
  stopRinging();
  playEndCall();
});

cancelCallButton.addEventListener("click", () => {
  const instance = M.Modal.getInstance(callingModal);
  instance.close();
  stopRinging();
  playEndCall();
  cancelCall();
});

acceptCallButton.addEventListener("click", async () => {
  const instance = M.Modal.getInstance(receivingCallModal);
  instance.close();

  const videoDevicesDropdown = M.Dropdown.getInstance(videoDeviceSelectTrigger);
  const deviceId =
    videoDevicesDropdown.selectedItem?.dataset?.deviceId ||
    (await getVideoDevices())[0].deviceId;
  const remoteClientId = incomingClientIdLabel.innerText;
  acceptCall(deviceId, remoteClientId);
  stopRinging();
  playStartCall();

  startCallButton.disabled = true;
  endCallButton.disabled = false;
});

rejectCallButton.addEventListener("click", () => {
  rejectCall();
  const instance = M.Modal.getInstance(receivingCallModal);
  instance.close();
  stopRinging();
  playEndCall();
});

document.addEventListener("call-cancelled", () => {
  closePeerConnection();
  const instance = M.Modal.getInstance(receivingCallModal);
  instance.close();
  stopRinging();
  playEndCall();
});

document.addEventListener("call-ended", () => {
  closePeerConnection();

  targetIdInput.value = "";
  stopRinging();
  playEndCall();

  startCallButton.disabled = false;
  endCallButton.disabled = true;
});

document.addEventListener("call-rejected", () => {
  closePeerConnection();
  const instance = M.Modal.getInstance(callingModal);
  instance.close();
  stopRinging();
  playEndCall();
});

document.addEventListener("call-accepted", async (message) => {
  const answer = message.answer;
  await setAnswer(answer);
  const instance = M.Modal.getInstance(callingModal);
  instance.close();
  stopRinging();
  playStartCall();
});

document.addEventListener("incoming-candidate", async (message) => {
  const candidate = message.candidate;
  setIncomingCandidate(candidate);
});

document.addEventListener("incoming-call", async (message) => {
  setIncomingCall(message.detail.sourceId, message.detail.offer);
  incomingClientIdLabel.textContent = message.sourceId;
  const instance = M.Modal.getInstance(receivingCallModal);
  instance.open();
  playRinging();
});

document.addEventListener("welcome", (message) => {
  const userId = message.detail.id;
  setLocalClientId(userId);
  sourceIdInput.value = userId;
});

document.addEventListener("remote-connection-ready", () => {
  setRemoteConnectionReady();
});

document.addEventListener("remote-track-received", (event) => {
  remoteVideo.srcObject = event.details.streams[0];
});

document.addEventListener("call-acknowledged", (event) => {
  targetIdInput.value = event.details.remoteClientId;
});

document.addEventListener("DOMContentLoaded", async () => {
  M.Modal.init(modalElems);
  M.Dropdown.init(dropdownElems, { coverTrigger: false });
  await populateVideoDevicesDropdown();
  connectToSignalingServer();
});

async function populateVideoDevicesDropdown() {
  M.Dropdown.init(videoDeviceSelectTrigger, {
    onOpenStart: async function () {
      const videoDeviceOptions = (await getVideoDevices())
        .map(
          (device) =>
            `<li data-device-id="${device.deviceId}"><a>${device.label}</a></li>`
        )
        .join("");

      videoDeviceSelect.innerHTML = videoDeviceOptions;
    },
    onItemClick: function (item) {
      this.selectedItem = item;
    },
  });
}
