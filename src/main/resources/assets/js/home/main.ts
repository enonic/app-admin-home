import {Application} from '@enonic/lib-admin-ui/app/Application';
import {AppBar} from '@enonic/lib-admin-ui/app/bar/AppBar';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ImgEl} from '@enonic/lib-admin-ui/dom/ImgEl';
import {ServerEventsListener} from '@enonic/lib-admin-ui/event/ServerEventsListener';
import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {ConnectionDetector} from '@enonic/lib-admin-ui/system/ConnectionDetector';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {LauncherHelper} from '@enonic/lib-admin-ui/util/LauncherHelper';
import {i18n, Messages} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {resolveScriptConfig} from '../ConfigResolver';
import {getModuleScript, getRequiredAttribute} from '../util/ModuleScriptHelper';
import {WidgetPanel} from './WidgetPanel';

const containerId = 'home-main-container';

const loadDOM = (): Q.Promise<void> => {
    const DOMLoaded: Q.Deferred<void> = Q.defer<void>();
    document.addEventListener('DOMContentLoaded', () => DOMLoaded.resolve());
    return DOMLoaded.promise;
};

const showBackgroundImage = () => {
    const containerEl = document.getElementById(containerId);
    if (!containerEl) {
        throw new Error('Main container not found!');
    }

    const container: Element = Element.fromHtmlElement(containerEl);
    const divEl = new DivEl('lazy-image empty');
    divEl.setId('background-image');
    const imgEl = new ImgEl(CONFIG.getString('backgroundUri'), 'lazy-image empty');

    container.appendChildren(divEl, imgEl);

    imgEl.onLoaded(() => {
        divEl.getEl().setAttribute('style', `background-image: url('${imgEl.getSrc()}')`);
        imgEl.remove();
        divEl.removeClass('empty');
    });
    container.appendChild(imgEl);
};

const initConfig = (configScriptId: string) => {
    CONFIG.setConfig(resolveScriptConfig(configScriptId));
    Messages.addMessages(JSON.parse(CONFIG.getString('phrases')) as object);
};

const setupWebSocketListener = () => {
    const dummyApp: Application = new Application('home', 'home', 'home', '');
    dummyApp.setWindow(window);

    const serverEventsListener: ServerEventsListener = new ServerEventsListener([dummyApp], CONFIG.getString('eventApiUrl'));
    serverEventsListener.start();
};

const startLostConnectionDetector = () => {
    ConnectionDetector.get(CONFIG.getString('statusApiUrl'))
        .setAuthenticated(true)
        .setSessionExpireRedirectUrl(CONFIG.getString('adminUrl'))
        .setNotificationMessage(i18n('notify.connection.loss'))
        .startPolling(true);
};

const addListenersToDashboardItems = () => {
    const dashboardItems = Array.from(document.getElementsByClassName('dashboard-item'));

    dashboardItems.forEach((item: HTMLElement) => {
        item.addEventListener('keypress', (e: KeyboardEvent) => {
            if(e.key === 'Enter') {
                (item.firstElementChild as HTMLElement).click();
            }
        });
    });
};

const appendDashboardWidgets = () => {
    const widgetContainerEl = document.getElementById(containerId);
    if (!widgetContainerEl) {
        throw new Error('Widget container not found!');
    }

    const widgetContainer: Element = Element.fromHtmlElement(widgetContainerEl);
    const widgetPanel: WidgetPanel = new WidgetPanel();
    widgetContainer.appendChild(widgetPanel);
    widgetPanel.appendWidgets();
};

const getApplication = (): Application => {
    const assetsUri: string = CONFIG.getString('assetsUri');
    const application = new Application(
        CONFIG.getString('appId'),
        i18n('home.dashboard'),
        '',
        `${assetsUri}/icons/widgets/icon-white.svg`,
    );
    application.setPath(Path.fromString('/'));

    return application;
}

const startApplication = () => {
    const appBar = new AppBar(getApplication());
    Body.get().appendChild(appBar);

    setupWebSocketListener();
    startLostConnectionDetector();
    addListenersToDashboardItems();
    LauncherHelper.appendLauncherPanel();
    appendDashboardWidgets();
}

void (async () => {
    const currentScript = getModuleScript('home');

    const configScriptId = getRequiredAttribute(currentScript, 'data-config-script-id');

    await loadDOM();
    initConfig(configScriptId);
    showBackgroundImage();
    startApplication();
})();
