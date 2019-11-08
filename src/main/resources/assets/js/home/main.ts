import {startPolling} from './sessionExpiredDetector';
import {init} from './xptour';
import {i18nInit} from 'lib-admin-ui/util/MessagesInitializer';
import {ModalDialogWithConfirmation} from 'lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {CookieHelper} from 'lib-admin-ui/util/CookieHelper';
import {Application} from 'lib-admin-ui/app/Application';
import {ServerEventsListener} from 'lib-admin-ui/event/ServerEventsListener';
import {BodyMask} from 'lib-admin-ui/ui/mask/BodyMask';
import {Body} from 'lib-admin-ui/dom/Body';
import {create as createAboutDialog} from './AboutDialog';

i18nInit(CONFIG.i18nUrl).then(() => {

    setupWebSocketListener();

    setupAboutDialog();

    startPolling();

    if (CONFIG.tourEnabled) {
        init().then(function (tourDialog: ModalDialogWithConfirmation) {
            const enonicXPTourCookie = CookieHelper.getCookie(
                'enonic_xp_tour'
            );
            if (!enonicXPTourCookie) {
                CookieHelper.setCookie('enonic_xp_tour', 'tour', 365);
                tourDialog.open();
            }

            document.querySelector('.xp-tour')
                .addEventListener('click', () => {
                    tourDialog.open();
                    setupBodyClickListeners(tourDialog);
                });
        });
    }
});

function setupWebSocketListener() {
    const dummyApp = new Application('home', 'home', 'home', '');
    dummyApp.setWindow(window);

    const serverEventsListener = new ServerEventsListener([dummyApp]);
    serverEventsListener.start();
}

function setupBodyClickListeners(dialog: ModalDialogWithConfirmation) {
    const bodyEl = BodyMask.get().getHTMLElement();

    function listener(e: MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
        if (dialog.isVisible()) {
            dialog.close();
        }
        bodyEl.removeEventListener('click', listener);
    }
    bodyEl.addEventListener('click', listener);
}

function setupAboutDialog() {
    const aboutDialog = createAboutDialog();

    document.querySelector('.xp-about').addEventListener('click', () => {
        Body.get().appendChild(aboutDialog);
        aboutDialog.open();
        setupBodyClickListeners(aboutDialog);
    });
}
