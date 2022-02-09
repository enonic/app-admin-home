import {ModalDialogWithConfirmation} from 'lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {CookieHelper} from 'lib-admin-ui/util/CookieHelper';
import {Application} from 'lib-admin-ui/app/Application';
import {ServerEventsListener} from 'lib-admin-ui/event/ServerEventsListener';
import {BodyMask} from 'lib-admin-ui/ui/mask/BodyMask';
import {Body} from 'lib-admin-ui/dom/Body';
import {ConnectionDetector} from 'lib-admin-ui/system/ConnectionDetector';
import {i18nInit} from 'lib-admin-ui/util/MessagesInitializer';
import {i18n} from 'lib-admin-ui/util/Messages';
import {create as createAboutDialog} from './AboutDialog';
import {init} from './xptour';
import 'core-js/features/promise';
import 'core-js/features/object';
import {CONFIG} from 'lib-admin-ui/util/Config';

void (async () => {
    if (!document.currentScript) {
        throw 'Legacy browsers are not supported';
    }
    const configServiceUrl = document.currentScript.getAttribute('data-config-service-url');

    await CONFIG.init(configServiceUrl);

    await i18nInit(CONFIG.getString('i18nUrl'));

    startLostConnectionDetector();
    setupWebSocketListener();
    setupAboutDialog();
    addListenersToDashboardItems();

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
                setupBodyClickListeners(tourDialog);
            };

            document.querySelector('.xp-tour').addEventListener('click', execute);
            document.querySelector('.xp-tour').addEventListener('keypress', (e: KeyboardEvent) => {
                if (e.key === 'Enter') { execute(e); }
            });
        });
    }
})();

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

    const execute = (e: Event | KeyboardEvent) => {
        e.preventDefault();
        Body.get().appendChild(aboutDialog);
        aboutDialog.open();
        setupBodyClickListeners(aboutDialog);
    };

    document.querySelector('.xp-about').addEventListener('click', execute);
    document.querySelector('.xp-about').addEventListener('keypress', (e: KeyboardEvent) => {
        if(e.key === 'Enter') { execute(e); }
    });
}

function startLostConnectionDetector() {
    ConnectionDetector.get()
        .setAuthenticated(true)
        .setSessionExpireRedirectUrl(`${CONFIG.getString('adminUrl')}/tool`)
        .setNotificationMessage(i18n('notify.connection.loss'))
        .startPolling(true);
}

function addListenersToDashboardItems() {
    const dashboardItems = Array.from(document.getElementsByClassName('dashboard-item'));
    
    dashboardItems.forEach((item: HTMLElement) => {
        item.addEventListener('keypress', (e: KeyboardEvent) => {
            if(e.key === 'Enter') { 
                (item.firstElementChild as HTMLElement).click(); 
            }
        });
    });
}
