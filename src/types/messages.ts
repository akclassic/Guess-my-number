export type GameMode = "infinite" | "limited";
export type PlayerId = "player1" | "player2";

export type ClientMessage =
  | { type: "join_matchmaking"; name: string; mode: GameMode }
  | { type: "submit_secret"; secret: string }
  | { type: "make_guess"; guess: string }
  | { type: "leave_matchmaking" }
  | { type: "ping" };

export type ServerMessage =
  | { type: "match_found"; matchId: string; opponentName: string; youAre: PlayerId; gameMode: GameMode }
  | { type: "request_secret" }
  | { type: "secret_accepted" }
  | { type: "turn_info"; yourTurn: boolean; turnNumber: number; startingPlayer: PlayerId }
  | { type: "guess_result"; guess: string; bulls: number; cows: number; by: PlayerId }
  | { type: "invalid_move"; reason: string }
  | { type: "game_over"; winner: "you" | "opponent"; secret: string }
  | { type: "opponent_left" }
  | { type: "error"; message: string }
  | { type: "pong" };
