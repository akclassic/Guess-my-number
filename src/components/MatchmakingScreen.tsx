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

type RoomMode = "quick" | "create" | "join";

const WS_URL = "ws://localhost:3001";

export function MatchmakingScreen({ onMatchFound }: Props) {
    const [name, setName] = useState("");
    const [mode, setMode] = useState<"infinite" | "limited">("infinite");
    const [isJoining, setIsJoining] = useState(false);
    const [roomMode, setRoomMode] = useState<RoomMode>("quick");
    const [roomId, setRoomId] = useState<string>("");
    const [infoMessage, setInfoMessage] = useState<string | null>(null);

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

        if (lastMessage.type === "room_Created") {
            setIsJoining(true);
            setRoomId(lastMessage.roomId);
            setInfoMessage(`Room created! Share this ID with your friend: ${lastMessage.roomId}`);
        }

        if (lastMessage.type === "error") {
            setIsJoining(false);
            setInfoMessage(`Error: ${lastMessage.message}`);
        }

    }, [lastMessage, onMatchFound]);

    const handleQuickMatch = () => {
        if (!name.trim()) return;

        setIsJoining(true);
        setInfoMessage(null);

        send({
            type: "join_matchmaking",
            name,
            mode
        })
    }

    const handleCreateRoom = () => {
        if (!name.trim()) return;

        setIsJoining(true);
        setInfoMessage(null);
        setRoomId("");

        send({
            type: "create_room",
            name,
            mode,
        });
    }

    const handleJoinRoom = () => {
        if (!name.trim() || !roomId.trim()) return;
        setIsJoining(true);
        setInfoMessage(null);

        send({
            type: "join_room",
            name,
            mode,
            roomId,
        })
    }

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
                    <div className="space-y-4">
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
                        {/* Match type selector */}
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={roomMode === "quick" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setRoomMode("quick")}
                            >
                                Quick Match
                            </Button>
                            <Button
                                variant={roomMode === "create" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setRoomMode("create")}
                            >
                                Create Room
                            </Button>
                            <Button
                                variant={roomMode === "join" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setRoomMode("join")}
                            >
                                Join Room
                            </Button>
                        </div>

                        {roomMode === "join" && (
                            !name.trim() ? "Enter your name to create a room" :
                                <div className="space-y-2">
                                    <Label htmlFor="roomId">Room ID</Label>
                                    <Input
                                        id="roomId"
                                        placeholder="Enter 6-character code"
                                        value={roomId}
                                        onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                                        className="bg-slate-900/70 border-slate-800 focus-visible:ring-sky-500 tracking-[0.2em] uppercase"
                                        maxLength={6}
                                    />
                                </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                            {roomMode === "quick" && (
                                !name.trim() ? "Enter your name to create a room" :
                                    <Button
                                        className="flex-1 bg-sky-600 hover:bg-sky-500"
                                        size="lg"
                                        onClick={handleQuickMatch}
                                        disabled={!name.trim() || isJoining}
                                    >
                                        {isJoining ? "Finding an opponent…" : "Find match"}
                                    </Button>
                            )}

                            {roomMode === "create" && (
                                !name.trim() ? "Enter your name to create a room" :
                                    <Button
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                                        size="lg"
                                        onClick={handleCreateRoom}
                                        disabled={!name.trim() || isJoining}
                                    >
                                        {isJoining ? "Waiting for your friend…" : "Create room"}
                                    </Button>
                            )}

                            {roomMode === "join" && (
                                !name.trim() ? null :
                                    <Button
                                        className="flex-1 bg-purple-600 hover:bg-purple-500"
                                        size="lg"
                                        onClick={handleJoinRoom}
                                        disabled={!name.trim() || roomId.trim().length !== 6 || isJoining}
                                    >
                                        {isJoining ? "Joining room…" : "Join room"}
                                    </Button>

                            )}
                        </div>

                        {infoMessage && (
                            <p className="text-xs text-slate-400 text-center mt-2">
                                {infoMessage}
                            </p>
                        )}

                        {roomMode === "quick" && (
                            !name.trim() ? null :
                                <p className="text-xs text-slate-500 text-center">
                                    The system will automatically match you with another player.
                                </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
