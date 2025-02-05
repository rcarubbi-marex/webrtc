let signalingServerSocket;

export function connectToSignalingServer() {
  const signalingServerUrl = import.meta.env.VITE_SIGNALING_SERVER_URL;
  if (!signalingServerUrl) {
    console.error(
      "Signaling server url not found. Please set VITE_SIGNALING_SERVER_URL in .env file."
    );
    return;
  }

  signalingServerSocket = new WebSocket(signalingServerUrl);

  signalingServerSocket.onopen = () => {
    console.log("Connected to signaling server.");
  };

  signalingServerSocket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const handler = messageHandler[message.type];

    if (!handler) {
      console.warn(`No handler for message type: ${message.type}`);
    }

    handler(message);
  };

  signalingServerSocket.onerror = (error) => {
    console.error("Error connecting to signaling server:", error);
  };

  signalingServerSocket.onclose = () => {
    console.log("Signaling server Connection closed.");
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
  ping: handlePingMessage,
};

function handlePingMessage(message) {
  const pongMessage = {
    type: "pong",
  };
  sendToSignalingServer(pongMessage);
}

function handleRemoteConnectionReadyMessage(message) {
  const event = new CustomEvent("remote-connection-ready", {
    detail: message,
  });

  document.dispatchEvent(event);
}

function handleWelcomeMessage(message) {
  const event = new CustomEvent("welcome", {
    detail: message,
  });

  document.dispatchEvent(event);
}

async function handleOfferMessage(message) {
  const event = new CustomEvent("incoming-call", {
    detail: message,
  });

  document.dispatchEvent(event);
}

function handleCandidateMessage(message) {
  const event = new CustomEvent("incoming-candidate", {
    detail: message,
  });

  document.dispatchEvent(event);
}

async function handleAnswerMessage(message) {
  const event = new CustomEvent("call-accepted", {
    detail: message,
  });

  document.dispatchEvent(event);
}

function handleCancelCallMessage(message) {
  const event = new CustomEvent("call-cancelled", {
    detail: message,
  });
  document.dispatchEvent(event);
}

function handleEndMessage(message) {
  const event = new CustomEvent("call-ended", {
    detail: message,
  });
  document.dispatchEvent(event);
}

function handleRejectMessage(message) {
  const event = new CustomEvent("call-rejected", {
    detail: message,
  });
  document.dispatchEvent(event);
}

export function sendToSignalingServer(message) {
  if (!signalingServerSocket) {
    connectToSignalingServer();
  }

  signalingServerSocket.send(JSON.stringify(message));
}
