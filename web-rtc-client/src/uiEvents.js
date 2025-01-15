import {
  initiateCall,
  endCall,
  acceptCall,
  rejectCall,
  getVideoDevices,
  toggleAudio,
  toggleCamera,
  cancelCall,
} from "./rtc";
import {
  muteButton,
  cameraButton,
  endCallButton,
  startCallButton,
  targetIdInput,
  videoDeviceSelect,
  videoDeviceSelectTrigger,
  dropdownElems,
  modalElems,
  acceptCallButton,
  rejectCallButton,
  receivingCallModal,
  cancelCallButton,
  callingModal,
} from "./uiControls";
import { playRinging, playStartCall, stopRinging, playEndCall } from "./fx";

let videoDeviceDropdown;

M.Modal.init(modalElems);
M.Dropdown.init(dropdownElems, { coverTrigger: false });
initializeVideoDeviceSelect();

async function initializeVideoDeviceSelect() {
  videoDeviceDropdown = M.Dropdown.init(videoDeviceSelectTrigger, {
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

startCallButton.addEventListener("click", async () => {
  const remoteClientId = targetIdInput.value.trim();

  if (!remoteClientId) {
    M.toast({
      html: "Por favor, insira um ID de destino válido",
      classes: "rounded",
      displayLength: 2000,
    });
    return;
  }

  const instance = M.Modal.getInstance(callingModal);
  instance.open();

  playRinging();

  const deviceId =
    videoDeviceDropdown.selectedItem?.dataset?.deviceId ||
    (await getVideoDevices())[0].deviceId;

  initiateCall(remoteClientId, deviceId);

  startCallButton.disabled = true;
  endCallButton.disabled = false;
});

muteButton.addEventListener("click", () => {
  const icon = muteButton.querySelector("i");
  icon.innerHTML = icon.innerHTML === "mic_off" ? "mic" : "mic_off";
  toggleAudio();
});

cameraButton.addEventListener("click", () => {
  const icon = cameraButton.querySelector("i");
  icon.innerHTML =
    icon.innerHTML === "videocam_off" ? "videocam" : "videocam_off";
  toggleCamera();
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

  const deviceId =
    videoDeviceDropdown.selectedItem?.dataset?.deviceId ||
    (await getVideoDevices())[0].deviceId;
  acceptCall(deviceId);
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
