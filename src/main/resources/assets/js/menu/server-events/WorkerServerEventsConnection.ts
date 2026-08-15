export interface TopicNotification {
    type: 'event' | 'loss';
    topic: string;
    data?: unknown;
    count?: number | null;
}

export type ReceivedHandler = (notification: TopicNotification) => void;

interface AdminEventsSocket {
    connect(): void;

    subscribe(topic: string): void;
}

interface AdminEventsClientModule {
    AdminEventsSocket: new (url: string, handlers: {
        onEvent: (event: {topic: string; data?: unknown}) => void;
        onLoss: (loss: {topic: string; count: number | null}) => void;
    }) => AdminEventsSocket;
}

// the worker is shared by script url and name, so both must match whatever other admin tools use
const WORKER_NAME = 'xp-admin-events-socket';

/**
 * Connects to the admin events hub through the shared worker the hub itself serves - one socket
 * per browser, whichever admin pages are open - falling back to a socket of this page's own.
 */
export class WorkerServerEventsConnection {

    private readonly eventsUrl: string;

    private readonly topics = new Set<string>();

    private receivedHandler: ReceivedHandler = () => undefined;

    private worker: SharedWorker | null = null;

    private localSocket: AdminEventsSocket | null = null;

    private localSocketStarting = false;

    constructor(eventsUrl: string) {
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
                // no module worker support, or the browser refused it
                console.error('[xp-menu] Failed to start SharedWorker, using direct socket:', e);
            }
        }
        this.startLocalSocket();
    }

    private get clientUrl(): string {
        return `${this.eventsUrl}/client.js`;
    }

    private startSharedWorker(): void {
        const worker = new SharedWorker(this.clientUrl, {type: 'module', name: WORKER_NAME});
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
        this.topics.forEach(topic => worker.port.postMessage({type: 'subscribe', topic}));
    }

    private startLocalSocket(): void {
        // the client arrives over the network here, so the guard has to cover the wait, not just
        // a socket that already exists
        if (this.localSocket || this.localSocketStarting) {
            return;
        }
        this.localSocketStarting = true;

        import(/* @vite-ignore */ this.clientUrl)
            .then((module: AdminEventsClientModule) => {
                const socket = new module.AdminEventsSocket(this.eventsUrl, {
                    onEvent: event => this.receivedHandler({type: 'event', topic: event.topic, data: event.data}),
                    onLoss: loss => this.receivedHandler({type: 'loss', topic: loss.topic, count: loss.count}),
                });
                this.localSocket = socket;
                socket.connect();
                // topics asked for while the client was loading
                this.topics.forEach(topic => socket.subscribe(topic));
            })
            .catch(e => {
                this.localSocketStarting = false;
                console.error('[xp-menu] Failed to load the admin events client:', e);
            });
    }
}
