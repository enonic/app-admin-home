import {ModalDialogWithConfirmation} from '@enonic/lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {CookieHelper} from '@enonic/lib-admin-ui/util/CookieHelper';
import {Application} from '@enonic/lib-admin-ui/app/Application';
import {ServerEventsListener} from '@enonic/lib-admin-ui/event/ServerEventsListener';
import {BodyMask} from '@enonic/lib-admin-ui/ui/mask/BodyMask';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {ConnectionDetector} from '@enonic/lib-admin-ui/system/ConnectionDetector';
import {i18nInit} from '@enonic/lib-admin-ui/util/MessagesInitializer';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {create as createAboutDialog} from './AboutDialog';
import {init} from './xptour';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {WidgetPanel} from './WidgetPanel';

void (async () => {
    if (!document.currentScript) {
        throw new Error('Legacy browsers are not supported');
    }
    const configServiceUrl = document.currentScript.getAttribute('data-config-service-url');

    await CONFIG.init(configServiceUrl);

    await i18nInit(CONFIG.getString('i18nUrl'));

    startLostConnectionDetector();
    setupWebSocketListener();
    setupAboutDialog();
    addListenersToDashboardItems();

    appendDashboardWidgets('widget-container');

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

function appendDashboardWidgets(containerId: string) {
    const widgetContainerEl = document.getElementById(containerId);
    if (!widgetContainerEl) {
        throw new Error('Widget container not found!');
    }

    const widgetPanel = new WidgetPanel();
    widgetPanel.layout()
        .then((hasWidgets: true) => {
            const widgetContainer: Element = Element.fromHtmlElement(widgetContainerEl);
            widgetContainer.addClass('widgets-visible');
            widgetContainer.appendChild(widgetPanel);
        })
        .catch(DefaultErrorHandler.handle);
}
