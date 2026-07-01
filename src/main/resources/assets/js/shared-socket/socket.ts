const WS_PROTOCOL = 'json';

const CONNECTION_TIMEOUT = 60000;
const PING_INTERVAL = 50000;
const PONG_TIMEOUT = 15000;
const MAX_RECONNECT_DELAY = 30000;

export type ServerMessageHandler = (message: Record<string, unknown>) => void;

export class ServerEventsSocket {

    private readonly url: string;

    private readonly onServerMessage: ServerMessageHandler;

    private ws: WebSocket | null = null;

    private reconnectAttempts = 0;

    private closed = false;

    private pingInterval: ReturnType<typeof setInterval> | undefined;

    private pongTimeout: ReturnType<typeof setTimeout> | undefined;

    private reconnectTimeout: ReturnType<typeof setTimeout> | undefined;

    private connectionTimeout: ReturnType<typeof setTimeout> | undefined;

    constructor(url: string, onServerMessage: ServerMessageHandler) {
        this.url = url;
        this.onServerMessage = onServerMessage;
    }

    connect(): void {
        this.closed = false;

        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const ws = new WebSocket(this.url, [WS_PROTOCOL]);
        this.ws = ws;

        this.connectionTimeout = setTimeout(() => {
            if (ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        }, CONNECTION_TIMEOUT);

        ws.onopen = () => {
            clearTimeout(this.connectionTimeout);
            this.reconnectAttempts = 0;
            this.send({type: 'connect'});

            this.pingInterval = setInterval(() => {
                this.send({type: 'ping'});
                clearTimeout(this.pongTimeout);
                this.pongTimeout = setTimeout(() => this.reconnect(), PONG_TIMEOUT);
            }, PING_INTERVAL);
        };

        ws.onmessage = (e: MessageEvent<string>) => this.handleMessage(e);

        ws.onclose = () => {
            clearTimeout(this.connectionTimeout);
            this.teardownTimers();
            if (!this.closed) {
                this.scheduleReconnect();
            }
        };

        ws.onerror = () => {
            return;
        };
    }

    close(): void {
        this.closed = true;
        this.teardownTimers();
        clearTimeout(this.reconnectTimeout);

        if (this.ws) {
            this.ws.onclose = null;
            this.ws.close();
            this.ws = null;
        }
    }

    private send(message: Record<string, unknown>): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }

    private handleMessage(event: MessageEvent<string>): void {
        let message: Record<string, unknown>;
        try {
            message = JSON.parse(event.data) as Record<string, unknown>;
        } catch (e) {
            return;
        }

        if (!message || typeof message.type !== 'string') {
            return;
        }

        switch (message.type) {
        case 'connected':
            this.send({type: 'subscribe'});
            break;
        case 'pong':
            clearTimeout(this.pongTimeout);
            break;
        case 'disconnected':
            this.reconnect();
            break;
        default:
            this.onServerMessage(message);
        }
    }

    private reconnect(): void {
        if (this.ws) {
            this.ws.close();
        }
    }

    private scheduleReconnect(): void {
        this.reconnectAttempts += 1;
        const delay = Math.min(2 ** this.reconnectAttempts * 1000, MAX_RECONNECT_DELAY);
        this.reconnectTimeout = setTimeout(() => this.connect(), delay);
    }

    private teardownTimers(): void {
        clearInterval(this.pingInterval);
        clearTimeout(this.pongTimeout);
    }
}
