import {AdminEventsSocket} from '../../shared-socket/socket';

export interface TopicNotification {
    type: 'event' | 'loss';
    topic: string;
    data?: unknown;
    count?: number | null;
}

export type ReceivedHandler = (notification: TopicNotification) => void;

/**
 * Connects to the admin events hub through the shared worker when available - one socket per
 * browser, whichever admin pages are open - falling back to a socket of this page's own.
 */
export class WorkerServerEventsConnection {

    private readonly sharedSocketUrl: string;

    private readonly eventsUrl: string;

    private readonly topics = new Set<string>();

    private receivedHandler: ReceivedHandler = () => undefined;

    private worker: SharedWorker | null = null;

    private localSocket: AdminEventsSocket | null = null;

    constructor(sharedSocketUrl: string, eventsUrl: string) {
        this.sharedSocketUrl = sharedSocketUrl;
        this.eventsUrl = eventsUrl;
    }

    onReceived(handler: ReceivedHandler): void {
        this.receivedHandler = handler;
    }

    subscribe(topic: string): void {
        if (this.topics.has(topic)) {
            return;
        }
        this.topics.add(topic);
        if (this.worker) {
            this.worker.port.postMessage({type: 'subscribe', topic});
        }
        this.localSocket?.subscribe(topic);
    }

    start(): void {
        if (typeof SharedWorker !== 'undefined') {
            try {
                this.startSharedWorker();
                return;
            } catch (e) {
                console.error('[xp-menu] Failed to start SharedWorker, using direct socket:', e);
            }
        }
        this.startLocalSocket();
    }

    private startSharedWorker(): void {
        const worker = new SharedWorker(this.sharedSocketUrl, {type: 'module', name: 'xp-admin-events-socket'});
        this.worker = worker;

        worker.port.onmessage = (e: MessageEvent) => {
            const message = e.data as Partial<TopicNotification>;
            if (message && (message.type === 'event' || message.type === 'loss') && typeof message.topic === 'string') {
                this.receivedHandler(message as TopicNotification);
            }
        };

        worker.onerror = () => {
            console.error('[xp-menu] SharedWorker error, using direct socket');
            this.worker = null;
            this.startLocalSocket();
        };

        worker.port.start();
        worker.port.postMessage({type: 'init', wsUrl: this.eventsUrl});
        this.topics.forEach(topic => worker.port.postMessage({type: 'subscribe', topic}));
    }

    private startLocalSocket(): void {
        if (this.localSocket) {
            return;
        }
        this.localSocket = new AdminEventsSocket(this.eventsUrl, {
            onEvent: event => this.receivedHandler({type: 'event', topic: event.topic, data: event.data}),
            onLoss: loss => this.receivedHandler({type: 'loss', topic: loss.topic, count: loss.count}),
        });
        this.localSocket.connect();
        this.topics.forEach(topic => this.localSocket.subscribe(topic));
    }
}
