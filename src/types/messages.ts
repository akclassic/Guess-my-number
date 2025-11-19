export type ClientMessage = 
| { type: "join_matchmakeing"; playerName: string} 
| { type: "submit_guess"; secret: string }
| { type: "make_guess"; guess: string }
| { type: "leave" }
| { type: "ping" };

export type ServerMessage = 
| { type: "match_found"; roomId: string; players: "player1" | "player2" }
| { type: "request_secret" }
| { type: "secret_accepted" }
| { type: "turn_info"; yourTurn: boolean }
| { type: "guess_result"; guess: string; bulls: number; cows: number; }
| { type: "invalid_move"; reason: string }
| { type: "game_over"; winner: "you" | "opponent"; secret: string }
| { type: "opponent_left" }
| { type: "error"; message: string }
| { type: "pong" };