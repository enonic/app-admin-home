import {init} from './xptour';
import {create as createAboutDialog} from './AboutDialog';
import ModalDialog = api.ui.dialog.ModalDialog;
import ConnectionDetector = api.system.ConnectionDetector;
import i18n = api.util.i18n;

api.util.i18nInit(CONFIG.i18nUrl).then(() => {

    startLostConnectionDetector();
    setupWebSocketListener();
    setupAboutDialog();

    if (CONFIG.tourEnabled) {
        init().then(function (tourDialog: ModalDialog) {
            const enonicXPTourCookie = api.util.CookieHelper.getCookie(
                'enonic_xp_tour'
            );
            if (!enonicXPTourCookie) {
                api.util.CookieHelper.setCookie('enonic_xp_tour', 'tour', 365);
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
    const dummyApp = new api.app.Application('home', 'home', 'home', '');
    dummyApp.setWindow(window);

    const serverEventsListener = new api.event.ServerEventsListener([dummyApp]);
    serverEventsListener.start();
}

function setupBodyClickListeners(dialog: ModalDialog) {
    const bodyEl = api.ui.mask.BodyMask.get().getHTMLElement();

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
        api.dom.Body.get().appendChild(aboutDialog);
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
