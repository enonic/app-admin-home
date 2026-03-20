import {CustomElement} from '@enonic/lib-admin-ui/dom/CustomElement';

export class MenuElement extends CustomElement {

    connectedCallback() {
        this.setAttribute('tabindex', '1');
        this.addEventListener('focus', () => {
            const button = this.shadowRoot?.getElementById('menu-button');
            if (button) {
                button.focus();
            }
        });
    }

    static create<T extends typeof CustomElement>(this: T): InstanceType<T> {
        return super.create('xp-menu') as InstanceType<T>;
    }
}
