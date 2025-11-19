// src/components/MatchmakingScreen.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useGameClient } from "@/hooks/useGameClient";
import { Badge } from "./ui/badge";
import type { GameMode } from "@/types/messages";

type Props = {
    onMatchFound: (data: { matchId: string; opponentName: string; youAre: "player1" | "player2"; gameMode: GameMode }) => void;
};

const WS_URL = "ws://localhost:3001";

export function MatchmakingScreen({ onMatchFound }: Props) {
    const [name, setName] = useState("");
    const [mode, setMode] = useState<"infinite" | "limited">("infinite");
    const [isJoining, setIsJoining] = useState(false);

    const { send, lastMessage, status } = useGameClient(WS_URL);

    useEffect(() => {
        if (!lastMessage) return;
        if (lastMessage.type === "match_found") {
            setIsJoining(false);
            onMatchFound({
                matchId: lastMessage.matchId,
                opponentName: lastMessage.opponentName,
                youAre: lastMessage.youAre,
                gameMode: lastMessage.gameMode,
            });
        }
    }, [lastMessage, onMatchFound]);

    const handleJoin = () => {
        if (!name.trim()) return;
        setIsJoining(true);

        send({
            type: "join_matchmaking",
            name,
            mode,
        });
    };

    const statusColor =
        status === "connected"
            ? "bg-emerald-500"
            : status === "connecting"
                ? "bg-amber-500"
                : "bg-red-500";

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-50 px-4">
            <Card className="w-full max-w-lg border-slate-800 bg-slate-900/60 backdrop-blur-xl shadow-xl">
                <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Guess The Number
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Server</span>
                            <span className={`h-2 w-2 rounded-full ${statusColor}`} />
                        </div>
                    </div>
                    <p className="text-sm text-slate-400 mt-2">
                        Online multiplayer · 4-digit number · no repeated digits
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Your name</Label>
                        <Input
                            id="name"
                            placeholder="Enter a cool nickname"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-slate-900/70 border-slate-800 focus-visible:ring-sky-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Game mode</Label>
                        <div className="flex items-center gap-3">
                            <Select
                                value={mode}
                                onValueChange={(v) => setMode(v as "infinite" | "limited")}
                            >
                                <SelectTrigger className="w-40 bg-slate-900/70 border-slate-800">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    <SelectItem value="infinite">Infinite</SelectItem>
                                    <SelectItem value="limited">Limited turns</SelectItem>
                                </SelectContent>
                            </Select>
                            {mode === "infinite" ? (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                                    Chill · No turn cap
                                </Badge>
                            ) : (
                                <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30">
                                    Sweaty · Limited turns
                                </Badge>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            className="flex-1 bg-sky-600 hover:bg-sky-500"
                            size="lg"
                            onClick={handleJoin}
                            disabled={!name.trim() || isJoining}
                        >
                            {isJoining ? "Finding an opponent…" : "Find match"}
                        </Button>
                    </div>

                    <p className="text-xs text-slate-500 text-center">
                        The system will automatically match you with another player.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
