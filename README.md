# WebRTC Proof of Concept

This repository contains a WebRTC Proof of Concept (POC) demonstrating real-time communication capabilities between clients using WebRTC technology. The project includes a signaling server and a web-based client application to establish peer-to-peer connections for audio, video, or data sharing.

## Features

- **Signaling Server**: Facilitates the exchange of connection information between peers to establish a direct communication channel.
- **WebRTC Client**: A web application that connects to the signaling server and manages peer-to-peer connections.
- **Static HTTP Server**: Uses Nginx to serve the frontend application.
- **Docker Support**: Includes a `docker-compose.yml` file for easy setup and deployment of the signaling server and client application.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine.
- [Ngrok](https://ngrok.com/) for exposing local servers to the internet (optional, for testing purposes).

## Getting Started

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/rcarubbi-marex/webrtc.git
   cd webrtc
   ```

2. **Initialize the Environment**:

   Run the PowerShell script to set up necessary configurations:

   ```powershell
   .\init.ps1
   ```

   This script sets up Ngrok for exposing the signaling server and the client application to the internet.

3. **Debug the Application**:

   Run both the signaling server and the WebRTC client in development mode using the following commands:

   ```bash
   cd signaling-server
   pnpm run dev
   ```

   In another terminal:

   ```bash
   cd web-rtc-client
   pnpm run dev
   ```

   This approach enables hot-reloading and live debugging during development.

4. **Access the Application**:

   - **Locally**: Open your browser and go to `http://localhost:5173`.
   - **Publicly**: If Ngrok is configured, use the public URL provided by the script.

## Configuration

- **Signaling Server**:

  The signaling server runs on port `3000`. You can adjust its configuration in the `docker-compose.yml` file if needed.

- **Nginx Server**:

  Nginx serves the frontend application on port `8080`. Its configuration can be found in the Docker setup.

- **Ngrok Configuration**:

  If you are using Ngrok, ensure it is installed and configured properly. The `init.ps1` script handles the Ngrok setup for you.
  Add your authtoken to the ngrok.yml file before run

## Project Structure

- `signaling-server/`: Contains the code for the signaling server.
- `web-rtc-client/`: Contains the web application code for the WebRTC client.
- `docker-compose.yml`: Docker Compose configuration file for setting up the application.
- `init.ps1`: PowerShell script for initializing the environment and setting up Ngrok.
- `nginx/`: Contains the configuration for the Nginx static server.

## Technologies Used

- **WebRTC**: For peer-to-peer communication.
- **Node.js**: Backend runtime for the signaling server.
- **Socket.IO**: For real-time communication between the client and signaling server.
- **Nginx**: Used as a static HTTP server to serve the frontend application.
- **Docker**: Containerization platform for easy deployment.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes. Ensure that your code follows the project's coding standards and includes appropriate tests.
