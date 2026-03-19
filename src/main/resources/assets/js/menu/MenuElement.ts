import {CustomElement} from '@enonic/lib-admin-ui/dom/CustomElement';

export class MenuElement extends CustomElement {
    static create<T extends typeof CustomElement>(this: T): InstanceType<T> {
        return super.create('xp-menu') as InstanceType<T>;
    }
}
