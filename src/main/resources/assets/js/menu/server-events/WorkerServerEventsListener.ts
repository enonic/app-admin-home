import {type Event} from '@enonic/lib-admin-ui/event/Event';
import {type EventJson} from '@enonic/lib-admin-ui/event/EventJson';
import {ServerEventsTranslator} from '@enonic/lib-admin-ui/event/ServerEventsTranslator';
import {WorkerServerEventsConnection} from './WorkerServerEventsConnection';

export class WorkerServerEventsListener {

    private readonly connection: WorkerServerEventsConnection;

    private readonly serverEventsTranslator = new ServerEventsTranslator();

    constructor(connection: WorkerServerEventsConnection) {
        this.connection = connection;
    }

    start(): void {
        this.connection.onReceived(payload => this.handleServerEvent(payload as unknown as EventJson));
        this.connection.start();
    }

    private handleServerEvent(eventJson: EventJson): void {
        const serverEvent: Event = this.serverEventsTranslator.translateServerEvent(eventJson);
        if (serverEvent) {
            serverEvent.fire();
        }
    }
}
