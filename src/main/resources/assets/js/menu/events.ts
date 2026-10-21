type Listener = () => void;

interface HubConnection {
    subscribe(topic: string): void;
}

// the client the hub serves at `${url}/client.js`
interface HubClient {
    connect(handlers: {
        onEvent: (event: {topic: string}) => void;
        onLoss: (loss: {topic: string}) => void;
    }): HubConnection;
}

interface Hub {
    connection: Promise<HubConnection>;
    listeners: Map<string, Set<Listener>>;
}

const hubs = new Map<string, Hub>();

const getHub = (url: string): Hub => {
    let hub = hubs.get(url);
    if (hub === undefined) {
        const listeners = new Map<string, Set<Listener>>();
        const notify = ({topic}: {topic: string}): void => listeners.get(topic)?.forEach(listener => listener());
        const connection = import(/* @vite-ignore */ `${url}/client.js`)
            .then((client: HubClient) => client.connect({onEvent: notify, onLoss: notify}));
        hub = {connection, listeners};
        hubs.set(url, hub);
        connection.catch(() => hubs.delete(url));
    }
    return hub;
};

export const subscribeTopic = (url: string, topic: string, listener: Listener): (() => void) => {
    const hub = getHub(url);
    let listeners = hub.listeners.get(topic);
    if (listeners === undefined) {
        listeners = new Set();
        hub.listeners.set(topic, listeners);
        hub.connection
            .then(connection => connection.subscribe(topic))
            .catch(e => console.error('[xp-menu] Failed to load the admin events client:', e));
    }
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};
