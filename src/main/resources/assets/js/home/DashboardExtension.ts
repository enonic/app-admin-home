import {CustomElement} from '@enonic/lib-admin-ui/dom/CustomElement';

export class DashboardExtension extends CustomElement {
    static create(): DashboardExtension {
        return CustomElement.create('dashboard-extension') as DashboardExtension;
    }
}
