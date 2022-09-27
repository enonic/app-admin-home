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
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {WidgetPanel} from './WidgetPanel';

const showBackgroundImageOnLoad = () => {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
                document.getElementById('background-image').classList.remove('empty');
            }
            , 100);
    });
};

const initConfig = async () => {
    if (!document.currentScript) {
        throw 'Legacy browsers are not supported';
    }

    const configServiceUrl: string = document.currentScript.getAttribute('data-config-service-url');

    await CONFIG.init(configServiceUrl);

    await i18nInit(CONFIG.getString('i18nUrl'));
};

const setupBodyClickListeners = (dialog: ModalDialogWithConfirmation) => {
    const bodyEl: HTMLElement = BodyMask.get().getHTMLElement();

    const listener = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (dialog.isVisible()) {
            dialog.close();
        }

        bodyEl.removeEventListener('click', listener);
    };

    bodyEl.addEventListener('click', listener);
};

const initTour = () => {
    if (CONFIG.getString('tourEnabled')) {
        void init().then((tourDialog: ModalDialogWithConfirmation) => {
            const enonicXPTourCookie: string = CookieHelper.getCookie('enonic_xp_tour');

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
};

const setupWebSocketListener = () => {
    const dummyApp: Application = new Application('home', 'home', 'home', '');
    dummyApp.setWindow(window);

    const serverEventsListener: ServerEventsListener = new ServerEventsListener([dummyApp]);
    serverEventsListener.start();
};

const setupAboutDialog = () => {
    const aboutDialog: ModalDialogWithConfirmation = createAboutDialog();

    const execute = (e: Event | KeyboardEvent) => {
        e.preventDefault();
        Body.get().appendChild(aboutDialog);
        aboutDialog.open();
        setupBodyClickListeners(aboutDialog);
    };

    document.querySelector('.xp-about').addEventListener('click', execute);
    document.querySelector('.xp-about').addEventListener('keypress', (e: KeyboardEvent) => {
        if (e.key === 'Enter') { execute(e); }
    });
};

const startLostConnectionDetector = () => {
    ConnectionDetector.get()
        .setAuthenticated(true)
        .setSessionExpireRedirectUrl(`${CONFIG.getString('adminUrl')}/tool`)
        .setNotificationMessage(i18n('notify.connection.loss'))
        .startPolling(true);
};

const addListenersToDashboardItems = () => {
    const dashboardItems: Element[] = Array.from(document.getElementsByClassName('dashboard-item'));

    dashboardItems.forEach((item: HTMLElement) => {
        item.addEventListener('keypress', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                (item.firstElementChild as HTMLElement).click();
            }
        });
    });
};

function appendDashboardWidgets(containerId: string) {
    const widgetContainerEl = document.getElementById(containerId);
    if (!widgetContainerEl) {
        throw new Error('Widget container not found!');
    }

    const widgetContainer: Element = Element.fromHtmlElement(widgetContainerEl);
    const widgetPanel: WidgetPanel = new WidgetPanel();
    widgetContainer.appendChild(widgetPanel);
    widgetPanel.fetchAndAppendWidgets();
}

void (async () => {
    showBackgroundImageOnLoad();
    await initConfig();
    startLostConnectionDetector();
    setupWebSocketListener();
    setupAboutDialog();
    addListenersToDashboardItems();
    appendDashboardWidgets('widget-container');
    initTour();
})();
