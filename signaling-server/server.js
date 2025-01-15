const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

console.log(`Signaling server started at ${PORT}`);

setInterval(() => {
  console.log("Clients connected:", clients.size);

  for (const [clientId, client] of clients.entries()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "ping" }));
    } else {
      console.log(`Client ${clientId} is not connected`);
      clients.delete(clientId);
    }
  }
}, 30000);

const clients = new Map();

wss.on("connection", (ws) => {
  connectClient(ws);
});

const messageHandlers = {
  offer: handleOffer,
  answer: handleAnswer,
  reject: handleReject,
  iceCandidate: handleIceCandidate,
  remote_connection_ready: handleRemoteConnectionReady,
  end: handleEnd,
  cancel_call: handleCancelCall,
  pong: () => {},
};

function handleEnd(jsonMessage, targetClient) {
  const message = {
    type: "end",
  };
  console.log("Sending end", message);
  targetClient.send(JSON.stringify(message));
}

function handleRemoteConnectionReady(jsonMessage, targetClient) {
  const message = {
    type: "remote_connection_ready",
  };
  console.log("Sending remote connection ready", message);

  targetClient.send(JSON.stringify(message));
}

function connectClient(ws) {
  const clientId = uuidv4();
  clients.set(clientId, ws);

  const message = {
    type: "welcome",
    id: clientId,
  };
  console.log("Sending welcome", message);

  ws.send(JSON.stringify(message));

  ws.on("message", (message) => {
    const jsonMessage = JSON.parse(message);
    console.log("Received message", jsonMessage);
    const messageType = jsonMessage.type;
    let targetClient;
    if (messageHandlers[messageType]) {
      if (jsonMessage.remoteClientId) {
        targetClient = clients.get(jsonMessage.remoteClientId);
        if (!targetClient) {
          console.warn(`Client not found: ${jsonMessage.remoteClientId}`);
          return;
        }
      }

      messageHandlers[messageType](jsonMessage, targetClient);
    } else {
      console.warn(`No handler for message type: ${messageType}`);
    }
  });

  ws.on("close", () => {
    clients.delete(clientId);
  });

  ws.on("error", (error) => {
    console.error(`Error on connection with client ${clientId}:`, error);
  });
}

function handleCancelCall(jsonMessage, targetClient) {
  const message = {
    type: "cancel_call",
  };
  console.log("Sending cancel call", message);
  targetClient.send(JSON.stringify(message));
}

function handleOffer(jsonMessage, targetClient) {
  const message = {
    type: "offer",
    offer: jsonMessage.offer,
    sourceId: jsonMessage.localClientId,
  };
  console.log("Sending offer", message);

  targetClient.send(JSON.stringify(message));
}

function handleAnswer(jsonMessage, targetClient) {
  const message = {
    type: "answer",
    answer: jsonMessage.answer,
  };
  console.log("Sending answer", message);
  targetClient.send(JSON.stringify(message));
}

function handleReject(jsonMessage, targetClient) {
  const message = {
    type: "reject",
  };
  console.log("Sending reject", message);

  targetClient.send(JSON.stringify(message));
}

function handleIceCandidate(jsonMessage, targetClient) {
  const message = {
    type: "iceCandidate",
    candidate: jsonMessage.candidate,
  };
  console.log("Sending ice candidate", message);

  targetClient.send(JSON.stringify(message));
}
