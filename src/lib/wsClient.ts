import type { ClientMessage as OutgoingMessage, ServerMessage as IncomingMessage } from "@/types/messages";

type Listener = (message: IncomingMessage) => void;
type StatusListener = (status: ConnectionStatus) => void;
type ConnectionStatus = "connecting" | "connected" | "disconnected";

export class GameWsClient {
    private socket: WebSocket | null = null;
    private listeners = new Set<Listener>();
    private statusListeners = new Set<StatusListener>();
    private url: string;
    private reconnectTimeout: number | null = null;
    private status: ConnectionStatus = "connecting";

    constructor(url: string) {
        this.url = url;
        this.connect();
    }

    private connect() {
        this.updateStatus("connecting");
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            console.log("WebSocket connected");
            this.updateStatus("connected");
        }

        this.socket.onclose = () => {
            console.log("[Ws] disconnected, will retry...");
            this.updateStatus("disconnected");
            if (!this.reconnectTimeout) {
                this.reconnectTimeout = window.setTimeout(() => {
                    this.reconnectTimeout = null;
                    this.connect();
                }, 2000);
            }
        }

        this.socket.onerror = (err) => {
            console.error("WebSocket error:", err);
        }

        this.socket.onmessage = (event) => {
            try {
                const data: IncomingMessage = JSON.parse(event.data);
                this.listeners.forEach(listener => listener(data));
            } catch (e) {
                console.error("Failed to parse message:", e);
            }
        }

    }

    send(message: OutgoingMessage) {
        if(!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn("WebSocket is not open. Cannot send message.");
            return;
        }
        this.socket.send(JSON.stringify(message));
    }

    subscribe(listener: Listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        }
    }

    onStatusChange(listener: StatusListener) {
        this.statusListeners.add(listener);
        listener(this.status);
        return () => {
            this.statusListeners.delete(listener);
        };
    }

    private updateStatus(status: ConnectionStatus) {
        this.status = status;
        this.statusListeners.forEach((listener) => listener(status));
    }
}
