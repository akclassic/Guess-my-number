import type { ServerWebSocket } from "bun";
import { GameRoom } from "./GameRoom";
import type { GameMode } from "@/types/messages";

type PlayerMeta = { socket: ServerWebSocket<any>; name: string; mode: GameMode };

export class Matchmaker {
    private waiting: PlayerMeta[] = [];
    private rooms: Map<string, GameRoom> = new Map();

    addPlayer(socket: ServerWebSocket<any>, name: string, mode: GameMode) {
        const opponentIndex = this.waiting.findIndex((player) => player.mode === mode);

        if (opponentIndex !== -1) {
            const opponent = this.waiting.splice(opponentIndex, 1)[0];
            this.createRoom({ socket, name, mode }, opponent);
            return;
        }

        this.waiting.push({ socket, name, mode });
    }

    private createRoom(player: PlayerMeta, opponent: PlayerMeta) {
        const roomId = crypto.randomUUID();
        const room = new GameRoom(roomId, player.socket, opponent.socket);
        this.rooms.set(roomId, room);

        player.socket.data.roomId = roomId;
        player.socket.data.playerId = "player1";
        player.socket.data.playerName = player.name;
        player.socket.data.gameMode = player.mode;

        opponent.socket.data.roomId = roomId;
        opponent.socket.data.playerId = "player2";
        opponent.socket.data.playerName = opponent.name;
        opponent.socket.data.gameMode = opponent.mode;

        player.socket.send(JSON.stringify({
            type: "match_found",
            matchId: roomId,
            opponentName: opponent.name,
            youAre: "player1",
            gameMode: player.mode,
        }));

        opponent.socket.send(JSON.stringify({
            type: "match_found",
            matchId: roomId,
            opponentName: player.name,
            youAre: "player2",
            gameMode: opponent.mode,
        }));

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