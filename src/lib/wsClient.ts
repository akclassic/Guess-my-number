export type OutgoingMessage =
    | { type: "join_matchmaking"; payload: { name: string } }
    | { type: "make_guess"; payload: { guess: string } }
    | { type: "leave_matchmaking" }

export type IncomingMessage =
    | { type: "matchmaking_joined"; matchId: string }
    | { type: "match_found"; mactchid: string; opponentName: string }
    | { type: "game_state"; state: any }
    | { type: "guess_result"; result: any }
    | { type: "error"; message: string }
    | { type: "pong" }
    | { type: string;[key: string]: any }; // For any additional message types

type Listener = (nessage: IncomingMessage) => void;

export class GameWsClient {
    private socket: WebSocket | null = null;
    private listeners = new Set<Listener>();
    private url: string;
    private reconnectTimeout: number | null = null;

    constructor(url: string) {
        this.url = url;
        this.connect();
    }

    private connect() {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
            console.log("WebSocket connected");
        }

        this.socket.onclose = () => {
            console.log("[Ws] disconnected, will retry...");
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
}