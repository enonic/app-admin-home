import {ServerEventsSocket} from '../../shared-socket/socket';

export type ReceivedHandler = (payload: Record<string, unknown>) => void;

export class WorkerServerEventsConnection {

    private readonly sharedSocketUrl: string;

    private readonly eventsUrl: string;

    private receivedHandler: ReceivedHandler = () => undefined;

    private worker: SharedWorker | null = null;

    private localSocket: ServerEventsSocket | null = null;

    constructor(sharedSocketUrl: string, eventsUrl: string) {
        this.sharedSocketUrl = sharedSocketUrl;
        this.eventsUrl = eventsUrl;
    }

    onReceived(handler: ReceivedHandler): void {
        this.receivedHandler = handler;
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
        const worker = new SharedWorker(this.sharedSocketUrl, {type: 'module', name: 'xp-menu-shared-socket'});
        this.worker = worker;

        worker.port.onmessage = (e: MessageEvent) => {
            const message = e.data as {type?: string; payload?: Record<string, unknown>};
            if (message && message.type === 'event' && message.payload) {
                this.receivedHandler(message.payload);
            }
        };

        worker.onerror = () => {
            console.error('[xp-menu] SharedWorker error, using direct socket');
            this.worker = null;
            this.startLocalSocket();
        };

        worker.port.start();
        worker.port.postMessage({type: 'init', wsUrl: this.eventsUrl});
    }

    private startLocalSocket(): void {
        if (this.localSocket) {
            return;
        }
        this.localSocket = new ServerEventsSocket(this.eventsUrl, payload => this.receivedHandler(payload));
        this.localSocket.connect();
    }
}
