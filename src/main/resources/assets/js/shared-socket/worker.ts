import {ServerEventsSocket} from './socket';

interface InitMessage {
    type: 'init';
    wsUrl: string;
}

interface SharedWorkerConnectEvent {
    ports: readonly MessagePort[];
}

const scope = self as unknown as {onconnect: ((event: SharedWorkerConnectEvent) => void) | null};

const ports = new Set<MessagePort>();

let socket: ServerEventsSocket | null = null;

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
    socket = new ServerEventsSocket(wsUrl, payload => broadcast({type: 'event', payload}));
    socket.connect();
}

scope.onconnect = (event: SharedWorkerConnectEvent): void => {
    const port = event.ports[0];
    ports.add(port);

    port.onmessage = (e: MessageEvent) => {
        const message = e.data as Partial<InitMessage>;
        if (message && message.type === 'init' && typeof message.wsUrl === 'string') {
            ensureSocket(message.wsUrl);
        }
    };

    port.start();
};
