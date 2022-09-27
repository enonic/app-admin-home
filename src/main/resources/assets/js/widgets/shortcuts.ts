import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {createAboutDialog} from './aboutdialog';
import {init} from './xptour';
import {ModalDialogWithConfirmation} from '@enonic/lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {CookieHelper} from '@enonic/lib-admin-ui/util/CookieHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';

const getElement = (selector: string): Promise<Element> => {
    const searchedElement: Element = document.querySelector(selector);

    if (searchedElement) {
        return Promise.resolve(searchedElement);
    }

    const promise: Promise<Element> = new Promise((resolve) => {
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

const initTourDialog = () => {
    if (CONFIG.getString('tourEnabled')) {
        void init().then(function (tourDialog: ModalDialogWithConfirmation) {
            const enonicXPTourCookie = CookieHelper.getCookie(
                'enonic_xp_tour',
            );
            if (!enonicXPTourCookie) {
                CookieHelper.setCookie('enonic_xp_tour', 'tour', 365);
                tourDialog.open();
            }

            const execute = (e: Event | KeyboardEvent) => {
                e.preventDefault();
                tourDialog.open();
            };

            getElement('.xp-tour').then((tourContainer: Element) => {
                tourContainer.addEventListener('click', execute);
                tourContainer.addEventListener('keypress', (e: KeyboardEvent) => {
                    if (e.key === 'Enter') { execute(e); }
                });
            }).catch(DefaultErrorHandler.handle);
        });
    }
};

(() => {
    const configServiceUrl: string = document.currentScript.getAttribute('data-config-service-url');

    CONFIG.init(configServiceUrl).then(() => {
        initAboutDialog();
        initTourDialog();
    }).catch(DefaultErrorHandler.handle);
})();
