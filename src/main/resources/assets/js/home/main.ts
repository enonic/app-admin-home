import {Application} from '@enonic/lib-admin-ui/app/Application';
import {AppBar} from '@enonic/lib-admin-ui/app/bar/AppBar';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ServerEventsListener} from '@enonic/lib-admin-ui/event/ServerEventsListener';
import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {ConnectionDetector} from '@enonic/lib-admin-ui/system/ConnectionDetector';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n, Messages} from '@enonic/lib-admin-ui/util/Messages';
import {MenuElement} from '../menu/MenuElement';
import {Menu, getMenuJsonConfig} from '../menu/main';
import * as Q from 'q';
import {resolveScriptConfig} from '../ConfigResolver';
import {getModuleScript, getRequiredAttribute} from '../util/ModuleScriptHelper';
import {DashboardPanel} from './DashboardPanel';

const containerId = 'home-main-container';

const loadDOM = (): Q.Promise<void> => {
    const DOMLoaded: Q.Deferred<void> = Q.defer<void>();
    document.addEventListener('DOMContentLoaded', () => DOMLoaded.resolve());
    return DOMLoaded.promise;
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

const appendMenuPanel = () => {
    const menuUrl = CONFIG.getString('menuUrl');
    if (!menuUrl) {
        throw new Error('Menu URL is not defined');
    }
    const menuElement = MenuElement.create();
    document.body.appendChild(menuElement);
    fetch(menuUrl)
        .then(response => response.text())
        .then((html: string) => menuElement.setHtml(html))
        .then(() => {
            const shadowRoot = menuElement.shadowRoot;
            const configEl = shadowRoot.getElementById('menu-config-json');
            if (configEl && !configEl.hasAttribute('data-menu-initialized')) {
                const config = getMenuJsonConfig(shadowRoot);
                new Menu(config, shadowRoot);
            }
        })
        .catch((e: Error) => {
            throw new Error(`Failed to fetch the Menu extension panel at ${menuUrl}: ${e.toString()}`);
        });
};

const appendDashboardExtensions = () => {
    const extensionContainerEl = document.getElementById(containerId);
    if (!extensionContainerEl) {
        throw new Error('Extension container not found!');
    }

    const extensionContainer: Element = Element.fromHtmlElement(extensionContainerEl);
    const extensionPanel: DashboardPanel = new DashboardPanel();
    extensionContainer.appendChild(extensionPanel);
    extensionPanel.appendExtensions();
};

const getApplication = (): Application => {
    const assetsUri: string = CONFIG.getString('assetsUri');
    const application = new Application(
        CONFIG.getString('appId'),
        i18n('home.dashboard'),
        '',
        `${assetsUri}/icons/extensions/icon-white.svg`,
    );
    application.setPath(Path.fromString('/'));

    return application;
}

const showDashboard = () => {
    const containerEl = document.getElementById(containerId);
    if (containerEl) {
        containerEl.classList.add('visible');
    }
    const menuEl = document.querySelector('xp-menu');
    if (menuEl) {
        menuEl.classList.add('transparent');
    }
};

const startApplication = () => {
    const appBar = new AppBar(getApplication());
    Body.get().appendChild(appBar);

    document.addEventListener('menu-background-ready', showDashboard, {once: true});

    setupWebSocketListener();
    startLostConnectionDetector();
    addListenersToDashboardItems();
    appendMenuPanel();
    appendDashboardExtensions();
}

void (async () => {
    const currentScript = getModuleScript('home');

    const configScriptId = getRequiredAttribute(currentScript, 'data-config-script-id');

    await loadDOM();
    initConfig(configScriptId);
    startApplication();
})();
