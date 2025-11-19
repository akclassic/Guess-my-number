import type { ServerWebSocket } from "bun";
import { computeBullsAndCows, isValidNumber } from "./GameEngine";
import type { PlayerId, ServerMessage } from "@/types/messages";

interface PlayerState {
    socket: ServerWebSocket<any>;
    secret?: string;
}

export class GameRoom {
    public readonly id: string;
    private players: Record<PlayerId, PlayerState>;
    private currentTurn: PlayerId | null = null;
    private isFinished = false;
    private startingPlayer: PlayerId | null = null;
    private turnNumber = 0;

    constructor(id: string, p1: ServerWebSocket<any>, p2: ServerWebSocket<any>) {
        this.id = id;
        this.players = {
            player1: { socket: p1 },
            player2: { socket: p2 },
        };
    }

    sendTo(player: PlayerId, message: ServerMessage) {
        this.players[player].socket.send(JSON.stringify(message));
    }

    broadcast(message: ServerMessage) {
        (["player1", "player2"] as PlayerId[]).forEach((id) => this.players[id].socket.send(JSON.stringify(message)));
    }

    init() {
        this.broadcast({ type: "request_secret" });
    }

    setSecret(player: PlayerId, secret: string): boolean {
        if(!isValidNumber(secret)) {
            this.sendTo(player, { type: "error", message: "Secret must be a 4 digit number with no repeating digits" });
            return false;
        }

        this.players[player].secret = secret;

        this.sendTo(player, { type: "secret_accepted" });

        if (this.players.player1.secret && this.players.player2.secret) {
            // both players have set their secrets, start the game
            this.startingPlayer = Math.random() < 0.5 ? "player1" : "player2";
            this.currentTurn = this.startingPlayer;
            this.turnNumber = 1;
            this.updateTurnInfo();
        }

        return true;
    }

    private updateTurnInfo() {
        if(!this.currentTurn || !this.startingPlayer) return;

        this.sendTo("player1", {
            type: "turn_info",
            yourTurn: this.currentTurn === "player1",
            turnNumber: this.turnNumber,
            startingPlayer: this.startingPlayer,
        });

        this.sendTo("player2", {
            type: "turn_info",
            yourTurn: this.currentTurn === "player2",
            turnNumber: this.turnNumber,
            startingPlayer: this.startingPlayer,
        });
    }

    handleGuess(player: PlayerId, guess: string) {
        if (this.isFinished) {
            this.sendTo(player, { type: "invalid_move", reason: "The game is already finished." });
            return;
        }

        if (this.currentTurn !== player) {
            this.sendTo(player, { type: "invalid_move", reason: "It's not your turn." });
            return;
        }

        if (!isValidNumber(guess)) {
            this.sendTo(player, { type: "invalid_move", reason: "Guess must be a 4 digit number with no repeating digits." });
            return;
        }

        const opponent: PlayerId  = player === "player1" ? "player2" : "player1";
        const opponentSecret = this.players[opponent].secret;

        if (!opponentSecret) {
            this.sendTo(player, { type: "invalid_move", reason: "Opponent's secret is not set yet." });
            return;
        }

        const { bulls, cows } = computeBullsAndCows(guess, opponentSecret);

        this.broadcast({ type: "guess_result", guess, bulls, cows, by: player });

        if (bulls === 4) {
            this.isFinished = true;
            this.sendTo(player, { type: "game_over", winner: "you", secret: opponentSecret });
            this.sendTo(opponent, { type: "game_over", winner: "opponent", secret: opponentSecret });
            return;
        }

        // switch turn
        this.currentTurn = opponent;
        this.turnNumber += 1;
        this.updateTurnInfo();
    }

    handleDisconnect(socket: ServerWebSocket<any>) {
        if (this.isFinished) return;

        const player = socket === this.players.player1.socket ? "player1" : "player2";
        const opponent: PlayerId = player === "player1" ? "player2" : "player1";

        this.sendTo(opponent, { type: "opponent_left" });
        this.isFinished = true;
    }
}