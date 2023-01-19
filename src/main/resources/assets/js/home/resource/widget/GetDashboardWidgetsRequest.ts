import * as Q from 'q';
import {GetByInterfaceRequest} from './GetByInterfaceRequest';
import {DashboardWidget} from './DashboardWidget';

export class GetDashboardWidgetsRequest
    extends GetByInterfaceRequest {

    constructor() {
        super(['home.dashboard']);
    }

    fetchWidgets(): Q.Promise<DashboardWidget[]> {
        return this.sendAndParse();
    }
}
