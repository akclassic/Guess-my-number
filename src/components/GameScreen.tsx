// src/components/GameScreen.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useGameClient } from "@/hooks/useGameClient";

type GuessRow = {
  guess: string;
  resultText: string; // e.g. "2 Bulls, 1 Cow"
};

type Props = {
  matchId: string;
  opponentName: string;
};

export function GameScreen({ matchId, opponentName }: Props) {
  const [guess, setGuess] = useState("");
  const [history, setHistory] = useState<GuessRow[]>([]);
  const [isMyTurn, setIsMyTurn] = useState(true); // stub: wire from backend
  const [statusMessage, setStatusMessage] = useState("Game started!");

  const { send, lastMessage } = useGameClient("ws://localhost:3000/ws"); // same URL as lobby

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "guess_result") {
      // adapt this based on your server payload
      const resultText =
        lastMessage.result?.text ??
        `${lastMessage.result?.bulls ?? "?"} Bulls, ${
          lastMessage.result?.cows ?? "?"
        } Cows`;

      setHistory((prev) => [
        ...prev,
        {
          guess: lastMessage.result?.guess ?? "?",
          resultText,
        },
      ]);

      if (lastMessage.result?.isWin) {
        setStatusMessage("You guessed it! 🎉");
        setIsMyTurn(false);
      } else {
        setIsMyTurn(false); // until server tells you it's your turn again
      }
    }

    if (lastMessage.type === "game_state") {
      // you can hydrate isMyTurn, history, etc. from here once your protocol is fixed
    }
  }, [lastMessage]);

  const handleSubmitGuess = () => {
    const trimmed = guess.trim();
    if (trimmed.length !== 4 || /(\d).*\1/.test(trimmed)) {
      setStatusMessage("Guess must be 4 unique digits.");
      return;
    }

    setStatusMessage("Guess sent…");
    send({
      type: "make_guess",
      payload: { guess: trimmed },
    });
    setGuess("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-50 px-4 py-6 flex items-center justify-center">
      <Card className="w-full max-w-3xl border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl sm:text-2xl font-semibold">
              Match #{matchId}
            </CardTitle>
            <p className="text-sm text-slate-400">
              Opponent:{" "}
              <span className="font-medium text-sky-400">{opponentName}</span>
            </p>
          </div>
          <Badge
            className={`mt-2 sm:mt-0 ${
              isMyTurn
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-slate-700/80 text-slate-300 border-slate-600"
            }`}
          >
            {isMyTurn ? "Your turn" : "Waiting for opponent"}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex gap-3 flex-col sm:flex-row">
              <Input
                placeholder="Enter 4-digit guess (e.g. 1234)"
                value={guess}
                maxLength={4}
                onChange={(e) => setGuess(e.target.value.replace(/\D/g, ""))}
                className="bg-slate-900/70 border-slate-800 focus-visible:ring-sky-500 text-lg tracking-[0.25em] text-center"
                disabled={!isMyTurn}
              />
              <Button
                className="bg-sky-600 hover:bg-sky-500"
                size="lg"
                onClick={handleSubmitGuess}
                disabled={!isMyTurn || guess.trim().length !== 4}
              >
                Guess
              </Button>
            </div>
            <p className="text-xs text-slate-400">
              - Exactly 4 digits • no repeated digits • leading zero allowed
            </p>
            <p className="text-xs text-slate-300">{statusMessage}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                Guess history
              </h2>
              <span className="text-xs text-slate-400">
                Total guesses: {history.length}
              </span>
            </div>
            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/40">
              {history.length === 0 ? (
                <div className="p-4 text-sm text-slate-500 text-center">
                  No guesses yet. Make your first move!
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-900/80 backdrop-blur">
                    <tr className="border-b border-slate-800">
                      <th className="py-2 px-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                        #
                      </th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                        Guess
                      </th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">
                        Result
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-800/60 last:border-b-0 hover:bg-slate-900/60"
                      >
                        <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono text-slate-100 tracking-[0.25em]">
                          {row.guess}
                        </td>
                        <td className="py-2 px-3 text-slate-200">
                          {row.resultText}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
