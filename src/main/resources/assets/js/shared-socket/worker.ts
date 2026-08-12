import {AdminEventsSocket} from './socket';

interface PortMessage {
    type: 'init' | 'subscribe';
    wsUrl?: string;
    topic?: string;
}

interface SharedWorkerConnectEvent {
    ports: readonly MessagePort[];
}

const scope = self as unknown as {onconnect: ((event: SharedWorkerConnectEvent) => void) | null};

const ports = new Set<MessagePort>();

// The union of every page's interest. Never unsubscribed: a SharedWorker cannot reliably tell
// when a page is gone, and an idle subscription costs one group membership on the server.
const topics = new Set<string>();

let socket: AdminEventsSocket | null = null;

function broadcast(message: Record<string, unknown>): void {
    ports.forEach(port => {
        try {
            port.postMessage(message);
        } catch (e) {
            ports.delete(port);
        }
    });
}

function ensureSocket(wsUrl: string): void {
    if (socket) {
        return;
    }
    socket = new AdminEventsSocket(wsUrl, {
        onEvent: event => broadcast({type: 'event', topic: event.topic, data: event.data}),
        onLoss: loss => broadcast({type: 'loss', topic: loss.topic, count: loss.count}),
    });
    socket.connect();
    topics.forEach(topic => socket.subscribe(topic));
}

function subscribe(topic: string): void {
    if (topics.has(topic)) {
        return;
    }
    topics.add(topic);
    socket?.subscribe(topic);
}

scope.onconnect = (event: SharedWorkerConnectEvent): void => {
    const port = event.ports[0];
    ports.add(port);

    port.onmessage = (e: MessageEvent) => {
        const message = e.data as Partial<PortMessage>;
        if (!message) {
            return;
        }
        if (message.type === 'init' && typeof message.wsUrl === 'string') {
            ensureSocket(message.wsUrl);
        } else if (message.type === 'subscribe' && typeof message.topic === 'string') {
            subscribe(message.topic);
        }
    };

    port.start();
};
