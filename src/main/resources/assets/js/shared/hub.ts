// the client the hub serves at `${url}/client.js`
interface HubClient {
    connect(handlers: {
        onEvent: (event: {topic: string; data: unknown}) => void;
        onLoss: (loss: {topic: string; count: number | null}) => void;
        onConnectionChange?: (connected: boolean) => void;
        onSessionEnd?: () => void;
    }): {subscribe(topic: string): void};
}

export interface HubHandlers {
    onTopic: (topic: string) => void;
    onConnectionChange: (connected: boolean) => void;
    onSessionEnd: () => void;
}

export const connectHub = (url: string, topics: string[], handlers: HubHandlers): void => {
    import(/* @vite-ignore */ `${url}/client.js`)
        .then((client: HubClient) => {
            const connection = client.connect({
                onEvent: ({topic}) => handlers.onTopic(topic),
                onLoss: ({topic}) => handlers.onTopic(topic),
                onConnectionChange: handlers.onConnectionChange,
                onSessionEnd: handlers.onSessionEnd,
            });
            topics.forEach(topic => connection.subscribe(topic));
        })
        .catch(e => console.error('Failed to load the admin events client:', e));
};
