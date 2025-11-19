// src/App.tsx
import { useState } from "react";
import { MatchmakingScreen } from "@/components/MatchmakingScreen";
import { GameScreen } from "@/components/GameScreen";

type MatchInfo = {
  matchId: string;
  opponentName: string;
};

function App() {
  const [match, setMatch] = useState<MatchInfo | null>(null);

  if (!match) {
    return <MatchmakingScreen onMatchFound={setMatch} />;
  }

  return (
    <GameScreen matchId={match.matchId} opponentName={match.opponentName} />
  );
}

export default App;
