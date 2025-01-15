import "materialize-css/dist/css/materialize.min.css";
import "materialize-css/dist/js/materialize.min.js";
import "./style.css";
import "./uiEvents.js";

import { connectToSignalingServer } from "./signalingClient.js";
console.log(import.meta.env);
connectToSignalingServer();
