import {
  initiateCall,
  endCall,
  acceptCall,
  rejectCall,
  videoDevices,
  defaultDeviceId,
  toggleAudio,
  toggleCamera,
  cancelCall
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
  callingModal
} from "./uiControls";
import { playRinging, playStartCall, stopRinging, playEndCall } from "./fx";

let isMuted = false;
let cameraDisabled = false;
let videoDeviceDropdown;


M.Modal.init(modalElems);
M.Dropdown.init(dropdownElems, { coverTrigger: false });
initializeVideoDeviceSelect();

function initializeVideoDeviceSelect() {
  const videoDeviceOptions = videoDevices
    .map(
      (device) =>
        `<li data-device-id="${device.deviceId}"><a>${device.label}</a></li>`
    )
    .join("");

  videoDeviceSelect.innerHTML = videoDeviceOptions;

  videoDeviceDropdown = M.Dropdown.init(videoDeviceSelectTrigger, {
    onItemClick: function (item) {
      this.selectedItem = item;
    },
  });
}


startCallButton.addEventListener("click", () => {
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
 
  const deviceId = videoDeviceDropdown.selectedItem?.dataset?.deviceId || defaultDeviceId;

  initiateCall(remoteClientId, deviceId);
  
});

muteButton.addEventListener("click", () => {
  const newIcon = isMuted ? "mic" : "mic_off";
  muteButton.innerHTML = `<i class="material-icons">${newIcon}</i>`;
  isMuted = !isMuted;
  
  toggleAudio(isMuted);
});

cameraButton.addEventListener("click", () => {
  const newIcon = cameraDisabled ? "videocam" : "videocam_off";
  cameraButton.innerHTML = `<i class="material-icons">${newIcon}</i>`;
  cameraDisabled = !cameraDisabled;
  toggleCamera(cameraDisabled);

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

acceptCallButton.addEventListener("click", () => {
  const instance = M.Modal.getInstance(receivingCallModal);
  instance.close();
  const deviceId =
    videoDeviceDropdown.selectedItem?.dataset?.deviceId || defaultDeviceId;
  acceptCall(deviceId);
  stopRinging();
  playStartCall();

});

rejectCallButton.addEventListener("click", () => {
  rejectCall();
  const instance = M.Modal.getInstance(receivingCallModal);
  instance.close();
  stopRinging();
  playEndCall();
});
