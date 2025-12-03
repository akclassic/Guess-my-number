import type { ServerWebSocket } from "bun";
import { GameRoom } from "./GameRoom";
import type { GameMode } from "@/types/messages";

type PlayerMeta = { socket: ServerWebSocket<any>; name: string; mode: GameMode };

export class Matchmaker {
    private waiting: PlayerMeta[] = [];
    private rooms: Map<string, GameRoom> = new Map();
    private pendingRooms: Map<string, PlayerMeta> = new Map();

    addPlayer(socket: ServerWebSocket<any>, name: string, mode: GameMode) {
        const opponentIndex = this.waiting.findIndex((player) => player.mode === mode);

        if (opponentIndex !== -1) {
            const opponent = this.waiting.splice(opponentIndex, 1)[0];
            this.createRoom({ socket, name, mode }, opponent as PlayerMeta);
            return;
        }

        this.waiting.push({ socket, name, mode });
    }

    private createRoom(player: PlayerMeta, opponent: PlayerMeta, roomId?: string) {
        const id = roomId ?? this.generateRoomId();
        const room = new GameRoom(id, player.socket, opponent.socket);
        this.rooms.set(id, room);

        player.socket.data.roomId = id;
        player.socket.data.playerId = "player1";
        player.socket.data.playerName = player.name;
        player.socket.data.gameMode = player.mode;

        opponent.socket.data.roomId = id;
        opponent.socket.data.playerId = "player2";
        opponent.socket.data.playerName = opponent.name;
        opponent.socket.data.gameMode = opponent.mode;

        player.socket.send(JSON.stringify({
            type: "match_found",
            matchId: id,
            opponentName: opponent.name,
            youAre: "player1",
            gameMode: player.mode,
        }));

        opponent.socket.send(JSON.stringify({
            type: "match_found",
            matchId: id,
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

        // remove pending hosted room if any
        const pendingRoomId = socket.data?.pendingRoomId;
        if (pendingRoomId && this.pendingRooms.get(pendingRoomId)?.socket === socket) {
            this.pendingRooms.delete(pendingRoomId);
        }

        
        const roomId = socket.data.roomId;
        const room = roomId ? this.rooms.get(roomId) : undefined;
        if (room) {
            room.handleDisconnect(socket);
            this.rooms.delete(roomId);
        }
    }

    private generateRoomId(): string {
        const chars: string = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let id = "";
        for (let i = 0; i < 6; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }

        if (this.rooms.has(id) || this.pendingRooms.has(id)) {
            return this.generateRoomId();
        }

        return id;
    }

    createRoomWithCode(socket: ServerWebSocket<any>, name: string, mode: GameMode) {
        const host: PlayerMeta = { socket, name, mode };
        const roomId = this.generateRoomId();
        this.pendingRooms.set(roomId, host);

        socket.data.pendingRoomId = roomId;
        socket.data.playerName = name;
        socket.data.gameMode = mode;

        socket.send(JSON.stringify({
            type: "room_Created",
            roomId,
        }));
    }

    joinRoomWithCode(socket: ServerWebSocket<any>, name: string, mode: GameMode, roomId: string) {
        const hostMeta = this.pendingRooms.get(roomId);
        if(!hostMeta) {
            socket.send(JSON.stringify({ type: "error", message: "Room not found or already started."}));
            return;
        }

        if (hostMeta.mode !== mode) {
            socket.send(JSON.stringify({ type: "error", message: "Game mode does not match the host's mode."}));
            return;
        }

        this.pendingRooms.delete(roomId);

        const joiner: PlayerMeta = { socket, name, mode };
        this.createRoom(hostMeta, joiner, roomId);
    }




}