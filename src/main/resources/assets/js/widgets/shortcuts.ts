import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {createAboutDialog} from './aboutdialog';
import {ModalDialogWithConfirmation} from '@enonic/lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {resolveHomeToolConfig} from '../ConfigResolver';

const getElement = (selector: string): Promise<Element> => {
    const searchedElement: Element = document.querySelector(selector);

    if (searchedElement) {
        return Promise.resolve(searchedElement);
    }

    const promise = new Promise<Element>((resolve) => {
        const intervalId = setInterval(() => {
            const searchedElement: Element = document.querySelector(selector);

            if (searchedElement) {
                clearInterval(intervalId);
                resolve(searchedElement);
            }
        }, 200);
    });

    return promise;
};

const initAboutDialog = () => {
    let aboutDialog: ModalDialogWithConfirmation;

    const execute = (e: Event | KeyboardEvent) => {
        e.preventDefault();

        if (!aboutDialog) {
            aboutDialog = createAboutDialog();
        }

        Body.get().appendChild(aboutDialog);
        aboutDialog.open();
    };

    getElement('.widget-shortcuts-xp-about').then((aboutContainer: Element) => {
        aboutContainer.addEventListener('click', execute);
        aboutContainer.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') { execute(e); }
        });
    }).catch(DefaultErrorHandler.handle);
};

(() => {
    try {
        CONFIG.setConfig(resolveHomeToolConfig());
        initAboutDialog();
    } catch (e) {
        DefaultErrorHandler.handle(e);
    }
})();
