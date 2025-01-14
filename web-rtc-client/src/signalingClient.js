import { sourceIdInput, receivingCallModal, callingModal, targetIdInput, incomingClientIdLabel } from "./uiControls";
import {
  setIncomingCall,
  setIncomingCandidate,
  setAnswer,
  localEndCall,
  setLocalClientId,
  setRemoteConnectionReady,
} from "./rtc";
import { playRinging, playStartCall, stopRinging, playEndCall } from "./fx";

let signalingServerSocket;

export function connectToSignalingServer() {
  const signalingServerUrl = import.meta.env.VITE_SIGNALING_SERVER_URL;
  if (!signalingServerUrl) {
    console.error(
      "O endereço do servidor de sinalização não está configurado!"
    );
    return;
  }

  signalingServerSocket = new WebSocket(signalingServerUrl);

  signalingServerSocket.onopen = () => {
    console.log("Conectado ao servidor de sinalização.");
  };

  signalingServerSocket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const handler = messageHandler[message.type];

    if (!handler) {
      console.warn(
        `Não há manipulador para o tipo de mensagem: ${message.type}`
      );
    }

    handler(message);
  };

  signalingServerSocket.onerror = (error) => {
    console.error("Erro na conexão com o servidor de sinalização:", error);
  };

  signalingServerSocket.onclose = () => {
    console.log("Conexão com o servidor de sinalização encerrada.");
  };
}

const messageHandler = {
  welcome: handleWelcomeMessage,
  offer: handleOfferMessage,
  iceCandidate: handleCandidateMessage,
  answer: handleAnswerMessage,
  end: handleEndMessage,
  reject: handleRejectMessage,
  remote_connection_ready: handleRemoteConnectionReadyMessage,
  cancel_call: handleCancelCallMessage,
};


function handleRemoteConnectionReadyMessage(message) {
  setRemoteConnectionReady();
}

function handleWelcomeMessage(message) {
  const userId = message.id;
  setLocalClientId(userId);
  sourceIdInput.value = userId;
}

async function handleOfferMessage(message) {
  setIncomingCall(message.sourceId, message.offer);
  incomingClientIdLabel.textContent = message.sourceId;
  const instance = M.Modal.getInstance(receivingCallModal);
  instance.open();
  playRinging();
}

function handleCandidateMessage(message) {
  const candidate = message.candidate;
  setIncomingCandidate(candidate);
}

async function handleAnswerMessage(message) {
  const answer = message.answer;
  await setAnswer(answer);
  
  const instance = M.Modal.getInstance(callingModal);
  instance.close();
  stopRinging();
  playStartCall();
}

function handleCancelCallMessage(message) {
  localEndCall();
  const instance = M.Modal.getInstance(receivingCallModal);
  instance.close();
  stopRinging();
  playEndCall();
}

function handleEndMessage(message) {
  localEndCall();
 
  targetIdInput.value = ""; 
  stopRinging();
  playEndCall();
}

function handleRejectMessage(message) {
  localEndCall();
  const instance = M.Modal.getInstance(callingModal);
  instance.close();
  stopRinging();
  playEndCall();
}

export function sendToSignalingServer(message) {
  signalingServerSocket.send(JSON.stringify(message));
}
