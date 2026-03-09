import {CustomElement} from '@enonic/lib-admin-ui/dom/CustomElement';

export class DashboardExtension extends CustomElement {
    static create<T extends typeof CustomElement>(this: T): InstanceType<T> {
        return super.create('dashboard-extension') as InstanceType<T>;
    }
}
