import * as Q from 'q';
import {GetByInterfaceRequest} from './GetByInterfaceRequest';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';

export class GetDashboardWidgetsRequest
    extends GetByInterfaceRequest {

    constructor() {
        super(['home.dashboard']);
    }

    fetchWidgets(): Q.Promise<Widget[]> {
        return this.sendAndParse();
    }
}
