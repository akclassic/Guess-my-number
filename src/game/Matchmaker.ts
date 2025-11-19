import type { ServerWebSocket } from "bun";
import { GameRoom } from "./GameRoom";

type PlayerMeta = { socket: ServerWebSocket<any> };

export class Matchmaker {
    private waiting: PlayerMeta[] = [];
    private rooms: Map<string, GameRoom> = new Map();

    addPlayer(socket: ServerWebSocket<any>) {
        this.waiting.push({ socket });
        this.tryMatch();
    }

    private tryMatch() {
        if (this.waiting.length >= 2) return;

        const player = this.waiting.shift()!;
        const opponent = this.waiting.shift()!;

        const roomId = crypto.randomUUID();
        const room = new GameRoom(roomId, player.socket, opponent.socket);
        this.rooms.set(roomId, room);

        // link sockets to room
        player.socket.data.roomId = roomId;
        player.socket.data.playerId = "player1";

        opponent.socket.data.roomId = roomId;
        opponent.socket.data.playerId = "player2";

        room.init();
    }

    getRoom(roomId: string | undefined | null): GameRoom | undefined {
        if (!roomId) return undefined;

        return this.rooms.get(roomId);
    }

    handleDisconnect(socket: ServerWebSocket<any>) {
        // if in waiting queue, remove
        this.waiting = this.waiting.filter(w => w.socket !== socket);

        const roomId = socket.data.roomId;
        const room = roomId ? this.rooms.get(roomId) : undefined;
        if (room) {
            room.handleDisconnect(socket);
            this.rooms.delete(roomId);
        }
    }
}