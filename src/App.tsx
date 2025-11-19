// src/App.tsx
import { useState } from "react";
import { MatchmakingScreen } from "@/components/MatchmakingScreen";
import { GameScreen } from "@/components/GameScreen";
import type { GameMode } from "@/types/messages";

type MatchInfo = {
  matchId: string;
  opponentName: string;
  youAre: "player1" | "player2";
  gameMode: GameMode;
};

function App() {
  const [match, setMatch] = useState<MatchInfo | null>(null);

  if (!match) {
    return <MatchmakingScreen onMatchFound={setMatch} />;
  }

  return (
    <GameScreen
      matchId={match.matchId}
      opponentName={match.opponentName}
      youAre={match.youAre}
      gameMode={match.gameMode}
    />
  );
}

export default App;
