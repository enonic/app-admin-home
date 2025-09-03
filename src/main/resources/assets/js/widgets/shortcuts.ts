import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {ModalDialogWithConfirmation} from '@enonic/lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {resolveScriptConfig} from '../ConfigResolver';
import {getModuleScript, getRequiredAttribute} from '../util/ModuleScriptHelper';
import {createAboutDialog} from './aboutdialog';

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

void (() => {
    const currentScript = getModuleScript('home');

    try {
        const configScriptId = getRequiredAttribute(currentScript, 'data-config-script-id');
        CONFIG.setConfig(resolveScriptConfig(configScriptId));

        initAboutDialog();
    } catch (e) {
        DefaultErrorHandler.handle(e);
    }
})();
