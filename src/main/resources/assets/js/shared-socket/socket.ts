const WS_PROTOCOL = 'json';

const CONNECTION_TIMEOUT = 60000;
const PING_INTERVAL = 50000;
const PONG_TIMEOUT = 15000;
const MAX_RECONNECT_DELAY = 30000;
const MAX_SUBSCRIBE_RETRY_DELAY = 30000;

export interface TopicEvent {
    topic: string;
    data?: unknown;
}

export interface TopicLoss {
    topic: string;
    // how many messages were missed, or null when it cannot be known (reconnect, hub restart)
    count: number | null;
}

export interface AdminEventsHandlers {
    onEvent: (event: TopicEvent) => void;
    onLoss: (loss: TopicLoss) => void;
}

interface Subscription {
    acked: boolean;
    everAcked: boolean;
    seq: number;
    epoch: string | null;
    retryAttempts: number;
    retryTimeout: ReturnType<typeof setTimeout> | undefined;
}

/**
 * Client for the admin events hub (`admin:events`). Holds the wanted-subscription set and
 * resubscribes it on every reconnect. A subscription denied as `unknown` is retried with
 * backoff; `forbidden` ends retries until the next reconnect. Loss is reported per
 * subscription: a sequence gap within an epoch is countable, an epoch change is an unknown
 * loss.
 */
export class AdminEventsSocket {

    private readonly url: string;

    private readonly handlers: AdminEventsHandlers;

    private readonly subscriptions = new Map<string, Subscription>();

    private ws: WebSocket | null = null;

    private reconnectAttempts = 0;

    private closed = false;

    private pingInterval: ReturnType<typeof setInterval> | undefined;

    private pongTimeout: ReturnType<typeof setTimeout> | undefined;

    private reconnectTimeout: ReturnType<typeof setTimeout> | undefined;

    private connectionTimeout: ReturnType<typeof setTimeout> | undefined;

    constructor(url: string, handlers: AdminEventsHandlers) {
        this.url = url;
        this.handlers = handlers;
    }

    subscribe(topic: string): void {
        if (this.subscriptions.has(topic)) {
            return;
        }
        this.subscriptions.set(topic, {
            acked: false,
            everAcked: false,
            seq: 0,
            epoch: null,
            retryAttempts: 0,
            retryTimeout: undefined,
        });
        this.send({type: 'subscribe', topic});
    }

    unsubscribe(topic: string): void {
        const subscription = this.subscriptions.get(topic);
        if (!subscription) {
            return;
        }
        clearTimeout(subscription.retryTimeout);
        this.subscriptions.delete(topic);
        this.send({type: 'unsubscribe', topic});
    }

    publish(topic: string, data?: unknown): void {
        this.send({type: 'pub', topic, data});
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
            this.resubscribeAll();

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

    private resubscribeAll(): void {
        this.subscriptions.forEach((subscription, topic) => {
            clearTimeout(subscription.retryTimeout);
            subscription.retryTimeout = undefined;
            subscription.retryAttempts = 0;
            subscription.acked = false;
            this.send({type: 'subscribe', topic});
        });
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
        case 'ack':
            this.handleAck(message);
            break;
        case 'deny':
            this.handleDeny(message);
            break;
        case 'event':
            this.handleEvent(message);
            break;
        case 'pong':
            clearTimeout(this.pongTimeout);
            break;
        case 'error':
            console.warn('[admin-events] Server reported:', message);
            break;
        default:
            break;
        }
    }

    private handleAck(message: Record<string, unknown>): void {
        const topic = String(message.topic);
        const subscription = this.subscriptions.get(topic);
        if (!subscription) {
            return;
        }

        const seq = Number(message.seq) || 0;
        const epoch = typeof message.epoch === 'string' ? message.epoch : null;

        if (subscription.everAcked) {
            if (epoch !== subscription.epoch) {
                this.handlers.onLoss({topic, count: null});
            } else if (seq > subscription.seq) {
                this.handlers.onLoss({topic, count: seq - subscription.seq});
            }
        }

        subscription.acked = true;
        subscription.everAcked = true;
        subscription.seq = seq;
        subscription.epoch = epoch;
        subscription.retryAttempts = 0;
    }

    private handleDeny(message: Record<string, unknown>): void {
        const topic = String(message.topic);
        const subscription = this.subscriptions.get(topic);
        if (!subscription) {
            return;
        }

        subscription.acked = false;

        if (message.reason === 'unknown') {
            subscription.retryAttempts += 1;
            const delay = Math.min(2 ** subscription.retryAttempts * 1000, MAX_SUBSCRIBE_RETRY_DELAY);
            clearTimeout(subscription.retryTimeout);
            subscription.retryTimeout = setTimeout(() => this.send({type: 'subscribe', topic}), delay);
        } else {
            console.warn(`[admin-events] Subscription to '${topic}' denied:`, message.reason);
        }
    }

    private handleEvent(message: Record<string, unknown>): void {
        const topic = String(message.topic);
        const subscription = this.subscriptions.get(topic);
        if (!subscription || !subscription.acked) {
            return;
        }

        const seq = Number(message.seq) || 0;
        if (seq <= subscription.seq) {
            return;
        }
        if (seq > subscription.seq + 1) {
            this.handlers.onLoss({topic, count: seq - subscription.seq - 1});
        }
        subscription.seq = seq;
        this.handlers.onEvent({topic, data: message.data});
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
        this.subscriptions.forEach(subscription => {
            clearTimeout(subscription.retryTimeout);
            subscription.retryTimeout = undefined;
            subscription.acked = false;
        });
    }
}
