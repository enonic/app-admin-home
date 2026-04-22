import {CustomElement} from '@enonic/lib-admin-ui/dom/CustomElement';

export class DashboardExtensionElement extends CustomElement {
    static create<T extends typeof CustomElement>(this: T): InstanceType<T> {
        return super.create('dashboard-widget') as InstanceType<T>;
    }
}
