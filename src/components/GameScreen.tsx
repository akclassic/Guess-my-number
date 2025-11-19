// src/components/GameScreen.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGameClient } from "@/hooks/useGameClient";
import { Badge } from "./ui/badge";
import type { GameMode, PlayerId } from "@/types/messages";

const WS_URL = "ws://localhost:3001";
const LIMITED_TURN_CAP = 10;

type GuessRow = {
    guess: string;
    resultText: string;
    by: "you" | "opponent";
};

type SecretStatus = "required" | "submitted" | "accepted";

type Props = {
    matchId: string;
    opponentName: string;
    youAre: PlayerId;
    gameMode: GameMode;
};

export function GameScreen({ matchId, opponentName, youAre, gameMode }: Props) {
    const [guess, setGuess] = useState("");
    const [history, setHistory] = useState<GuessRow[]>([]);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [statusMessage, setStatusMessage] = useState("Waiting for both secrets...");
    const [secret, setSecret] = useState("");
    const [secretStatus, setSecretStatus] = useState<SecretStatus>("required");
    const [turnNumber, setTurnNumber] = useState(0);
    const [startingPlayer, setStartingPlayer] = useState<PlayerId | null>(null);
    const [resultModal, setResultModal] = useState<{ winner: "you" | "opponent"; secret: string } | null>(null);

    const { send, lastMessage } = useGameClient(WS_URL);

    useEffect(() => {
        if (!lastMessage) return;

        switch (lastMessage.type) {
            case "request_secret":
                setSecretStatus("required");
                setStatusMessage("Set your secret number to begin.");
                break;
            case "secret_accepted":
                setSecretStatus("accepted");
                setStatusMessage("Secret locked in. Waiting for turn info...");
                break;
            case "turn_info":
                setIsMyTurn(lastMessage.yourTurn);
                setTurnNumber(lastMessage.turnNumber);
                setStartingPlayer(lastMessage.startingPlayer);
                setStatusMessage(lastMessage.yourTurn ? "Your move!" : "Opponent is thinking...");
                break;
            case "guess_result":
                setHistory((prev) => [
                    ...prev,
                    {
                        guess: lastMessage.guess,
                        resultText: `${lastMessage.bulls} Bulls, ${lastMessage.cows} Cows`,
                        by: lastMessage.by === youAre ? "you" : "opponent",
                    },
                ]);
                break;
            case "invalid_move":
                setStatusMessage(lastMessage.reason);
                break;
            case "game_over":
                setResultModal({ winner: lastMessage.winner, secret: lastMessage.secret });
                setStatusMessage(lastMessage.winner === "you" ? "You won!" : "Opponent won.");
                setIsMyTurn(false);
                break;
            case "opponent_left":
                setStatusMessage("Opponent left the game.");
                break;
            case "error":
                setStatusMessage(lastMessage.message);
                setSecretStatus("required");
                break;
        }
    }, [lastMessage, youAre]);

    const handleSubmitGuess = () => {
        const trimmed = guess.trim();
        if (trimmed.length !== 4 || /(\d).*\1/.test(trimmed)) {
            setStatusMessage("Guess must be 4 unique digits.");
            return;
        }

        setStatusMessage("Guess sent…");
        send({
            type: "make_guess",
            guess: trimmed,
        });
        setGuess("");
    };

    const handleSubmitSecret = () => {
        const trimmed = secret.trim();
        if (trimmed.length !== 4 || /(\d).*\1/.test(trimmed)) {
            setStatusMessage("Secret must be 4 unique digits.");
            return;
        }

        setSecretStatus("submitted");
        setStatusMessage("Secret submitted. Waiting for server confirmation…");
        send({ type: "submit_secret", secret: trimmed });
    };

    const canGuess = secretStatus === "accepted" && isMyTurn && guess.trim().length === 4;
    const canSubmitSecret = secretStatus === "required";
    const modeLabel = gameMode === "limited" ? "Limited turns" : "Infinite mode";
    const limitedSuffix = gameMode === "limited" ? ` / ${LIMITED_TURN_CAP}` : "";
    const turnLabel = turnNumber > 0 ? `Turn ${turnNumber}${limitedSuffix}` : "Waiting";
    const starterLabel = startingPlayer ? (startingPlayer === youAre ? "You" : opponentName) : null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-50 px-4 py-6 flex items-center justify-center">
            <Card className="w-full max-w-3xl border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl">
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-xl sm:text-2xl font-semibold">
                            Match #{matchId}
                        </CardTitle>
                        <p className="text-sm text-slate-400">
                            Opponent: <span className="font-medium text-sky-400">{opponentName}</span>
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-slate-800 text-slate-200 border-slate-700">{modeLabel}</Badge>
                        <Badge className="bg-sky-500/10 text-sky-300 border-sky-500/30">{turnLabel}</Badge>
                        {starterLabel && (
                            <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/30">
                                Random start: {starterLabel}
                            </Badge>
                        )}
                        <Badge className={isMyTurn ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-slate-700/80 text-slate-300 border-slate-600"}>
                            {isMyTurn ? "Your turn" : "Waiting"}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Secret setup</h3>
                        <div className="flex gap-3 flex-col sm:flex-row">
                            <Input
                                placeholder="Choose your secret"
                                value={secret}
                                maxLength={4}
                                onChange={(e) => setSecret(e.target.value.replace(/\D/g, ""))}
                                className="bg-slate-900/70 border-slate-800 focus-visible:ring-amber-400 text-lg tracking-[0.25em] text-center"
                                disabled={!canSubmitSecret}
                            />
                            <Button
                                variant="outline"
                                className="border-amber-500/40 text-amber-200"
                                onClick={handleSubmitSecret}
                                disabled={!canSubmitSecret || secret.trim().length !== 4}
                            >
                                {secretStatus === "submitted" ? "Submitting…" : secretStatus === "accepted" ? "Secret locked" : "Lock secret"}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex gap-3 flex-col sm:flex-row">
                            <Input
                                placeholder="Enter 4-digit guess (e.g. 1234)"
                                value={guess}
                                maxLength={4}
                                onChange={(e) => setGuess(e.target.value.replace(/\D/g, ""))}
                                className="bg-slate-900/70 border-slate-800 focus-visible:ring-sky-500 text-lg tracking-[0.25em] text-center"
                                disabled={!isMyTurn || secretStatus !== "accepted"}
                            />
                            <Button
                                className="bg-sky-600 hover:bg-sky-500"
                                size="lg"
                                onClick={handleSubmitGuess}
                                disabled={!canGuess}
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
                                                By
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
                                                <td className="py-2 px-3 text-slate-300 capitalize">{row.by}</td>
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
            {resultModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-xl font-semibold text-slate-100">
                            {resultModal.winner === "you" ? "Victory!" : "Defeat"}
                        </h3>
                        <p className="text-slate-300 text-sm">
                            {resultModal.winner === "you" ? "You cracked the code." : "Your opponent guessed your number."}
                        </p>
                        <p className="text-slate-400 text-sm">
                            Secret number: <span className="font-mono tracking-[0.25em] text-slate-100">{resultModal.secret}</span>
                        </p>
                        <div className="flex justify-end">
                            <Button onClick={() => setResultModal(null)} className="bg-sky-600 hover:bg-sky-500">
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
