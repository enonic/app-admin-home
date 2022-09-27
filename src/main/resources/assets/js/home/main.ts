import {Application} from '@enonic/lib-admin-ui/app/Application';
import {ServerEventsListener} from '@enonic/lib-admin-ui/event/ServerEventsListener';
import {ConnectionDetector} from '@enonic/lib-admin-ui/system/ConnectionDetector';
import {i18nInit} from '@enonic/lib-admin-ui/util/MessagesInitializer';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
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
    addListenersToDashboardItems();

    appendDashboardWidgets('widget-container');
})();

function setupWebSocketListener() {
    const dummyApp = new Application('home', 'home', 'home', '');
    dummyApp.setWindow(window);

    const serverEventsListener = new ServerEventsListener([dummyApp]);
    serverEventsListener.start();
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

    const widgetContainer: Element = Element.fromHtmlElement(widgetContainerEl);
    const widgetPanel: WidgetPanel = new WidgetPanel();
    widgetContainer.appendChild(widgetPanel);
    widgetPanel.fetchAndAppendWidgets();
}
