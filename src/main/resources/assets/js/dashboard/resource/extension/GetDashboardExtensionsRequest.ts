import * as Q from 'q';
import {GetByInterfaceRequest} from './GetByInterfaceRequest';
import {DashboardExtension} from './DashboardExtension';

export class GetDashboardExtensionsRequest
    extends GetByInterfaceRequest {

    constructor() {
        super('admin.dashboard');
    }

    fetchExtensions(): Q.Promise<DashboardExtension[]> {
        return this.sendAndParse();
    }
}
