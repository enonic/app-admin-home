import {CustomElement} from '@enonic/lib-admin-ui/dom/CustomElement';

export class MenuElement extends CustomElement {

    attachShadow(init: ShadowRootInit): ShadowRoot {
        return HTMLElement.prototype.attachShadow.call(this, {...init, delegatesFocus: true});
    }

    connectedCallback() {
        this.setAttribute('tabindex', '1');
    }

    static create<T extends typeof CustomElement>(this: T): InstanceType<T> {
        return super.create('xp-menu') as InstanceType<T>;
    }
}
