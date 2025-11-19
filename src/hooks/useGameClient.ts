import { useEffect, useMemo, useState } from "react";
import { GameWsClient } from "@/lib/wsClient";
import type { ClientMessage, ServerMessage } from "@/types/messages";

const clientCache = new Map<string, GameWsClient>();

function getClient(url: string) {
    if (!clientCache.has(url)) {
        clientCache.set(url, new GameWsClient(url));
    }
    return clientCache.get(url)!;
}

export function useGameClient(wsUrl: string) {
    const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);
    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");

    const client = useMemo(() => getClient(wsUrl), [wsUrl]);

    useEffect(() => {
        const unsubscribeMessage = client.subscribe((message) => {
            setLastMessage(message);
            if (message.type === "error") {
                console.error("Game Client Error:", message.message);
            }
        });

        const unsubscribeStatus = client.onStatusChange(setStatus);

        return () => {
            unsubscribeMessage();
            unsubscribeStatus();
        };
    }, [client]);

    const send = (message: ClientMessage) => client.send(message);

    return { send, lastMessage, status };
}
