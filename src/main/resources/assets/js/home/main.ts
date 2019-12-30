import {ModalDialogWithConfirmation} from 'lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {CookieHelper} from 'lib-admin-ui/util/CookieHelper';
import {Application} from 'lib-admin-ui/app/Application';
import {ServerEventsListener} from 'lib-admin-ui/event/ServerEventsListener';
import {BodyMask} from 'lib-admin-ui/ui/mask/BodyMask';
import {Body} from 'lib-admin-ui/dom/Body';
import {ConnectionDetector} from 'lib-admin-ui/system/ConnectionDetector';
import {i18nInit} from 'lib-admin-ui/util/MessagesInitializer';
import {showError} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {create as createAboutDialog} from './AboutDialog';
import {validateConfig} from '../validator';
import {init} from './xptour';

const config = Object.freeze(Object.assign({}, CONFIG));

Promise.resolve(true).then(() => {
    const {valid, errors} = validateConfig(config);
    if (!valid) {
        throw new Error(errors.join('\n'));
    }
    return config;
}).then(() => i18nInit(config.i18nUrl)).then(() => {
    startLostConnectionDetector();
    setupWebSocketListener();
    setupAboutDialog();

    if (config.tourEnabled) {
        init(config).then(function (tourDialog: ModalDialogWithConfirmation) {
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
}).catch((error: Error) => {
    showError(error.message);
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
    const aboutDialog = createAboutDialog(config);

    document.querySelector('.xp-about').addEventListener('click', () => {
        Body.get().appendChild(aboutDialog);
        aboutDialog.open();
        setupBodyClickListeners(aboutDialog);
    });
}

function startLostConnectionDetector() {
    ConnectionDetector.get()
        .setAuthenticated(true)
        .setSessionExpireRedirectUrl(CONFIG.adminUrl + '/tool')
        .setNotificationMessage(i18n('notify.connection.loss'))
        .startPolling(true);
}
