import { useEffect, useMemo, useState } from "react";
import { GameWsClient, type IncomingMessage, type OutgoingMessage } from "@/lib/wsClient";

export function useGameClient(wsUrl: string) {
    const [lastMessage, setLastMessage] = useState<IncomingMessage | null>(null);
    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

    const client = useMemo(() => new GameWsClient(wsUrl), [wsUrl]);

    useEffect(() => {
        const unsub = client.subscribe((message) => {
            setLastMessage(message);
            if (message.type === "error") {
                console.error("Game Client Error:", message.message);
            }
        });

        setStatus("connected");
        return () => {
            unsub();
            setStatus("disconnected");
        };
    }, [client]);

    const send = (message: OutgoingMessage) => client.send(message);

    return { send, lastMessage, status };
}