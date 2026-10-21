import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {Message} from '@enonic/lib-admin-ui/notify/Message';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n, Messages} from '@enonic/lib-admin-ui/util/Messages';
import type {XpMenuApi} from '../menu/loader';
import * as Q from 'q';
import {resolveScriptConfig} from '../ConfigResolver';
import {getRequiredAttribute} from '../util/ModuleScriptHelper';
import {DashboardPanel} from './DashboardPanel';

const containerId = 'home-main-container';

const removeOpenMenuParamFromUrl = () => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('openMenu')) {
        return;
    }

    url.searchParams.delete('openMenu');
    const query = url.searchParams.toString();
    const cleanUrl = `${url.pathname}${query ? `?${query}` : ''}${url.hash}`;
    window.history.replaceState(window.history.state, '', cleanUrl);
};

const loadDOM = (): Q.Promise<void> => {
    const DOMLoaded: Q.Deferred<void> = Q.defer<void>();
    document.addEventListener('DOMContentLoaded', () => DOMLoaded.resolve());
    return DOMLoaded.promise;
};

const initConfig = (configScriptId: string) => {
    CONFIG.setConfig(resolveScriptConfig(configScriptId));
    Messages.addMessages(JSON.parse(CONFIG.getString('phrases')) as object);
};

interface AdminEventsClient {
    connect(handlers: {
        onEvent: () => void;
        onLoss: () => void;
        onConnectionChange: (connected: boolean) => void;
        onSessionEnd: () => void;
    }): {subscribe(topic: string): void};
}

let connectionMessageId: string;
let connectionLostTimeout: number;

const hideConnectionMessage = () => {
    window.clearTimeout(connectionLostTimeout);
    if (connectionMessageId) {
        NotifyManager.get().hide(connectionMessageId);
        connectionMessageId = null;
    }
};

const handleConnectionChange = (connected: boolean) => {
    hideConnectionMessage();
    if (!connected) {
        connectionLostTimeout = window.setTimeout(() => {
            connectionMessageId = NotifyManager.get().showError(i18n('notify.connection.loss'), false);
        }, 1000);
    }
};

const handleSessionEnd = () => {
    hideConnectionMessage();
    const message = Message.newError(i18n('notify.session.expired'), false);
    message.addAction(i18n('action.refresh'), () => window.location.reload());
    connectionMessageId = NotifyManager.get().notify(message);
};

const startConnectionNotifier = () => {
    const eventsUrl = CONFIG.getString('eventsUrl');
    if (!eventsUrl) {
        return;
    }

    import(/* @vite-ignore */ `${eventsUrl}/client.js`)
        .then((client: AdminEventsClient) => {
            client.connect({
                onEvent: () => undefined,
                onLoss: () => undefined,
                onConnectionChange: handleConnectionChange,
                onSessionEnd: handleSessionEnd,
            });
        })
        .catch(e => console.error('Failed to load the admin events client:', e));
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
    const menu: XpMenuApi | undefined = window.XpMenu;
    if (!menu) {
        throw new Error('The menu loader is not on the page');
    }
    const autoOpen = CONFIG.isTrue('autoOpen');
    if (autoOpen) {
        document.addEventListener('menu-background-ready', showDashboard, {once: true});
        document.addEventListener('menu-panel-closed', showDashboard, {once: true});
    }
    menu.mount({autoOpen, hideButtonWhenOpen: autoOpen})
        .then(() => {
            if (!autoOpen) {
                showDashboard();
            }
        })
        .catch((e: Error) => {
            throw new Error(`Failed to mount the menu: ${e.toString()}`);
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
    startConnectionNotifier();
    addListenersToDashboardItems();
    appendMenuPanel();
    appendDashboardExtensions();
}

void (async () => {
    removeOpenMenuParamFromUrl();

    const currentScript = Array.from(document.querySelectorAll('script')).find(script => script.src === import.meta.url);
    if (!currentScript) {
        throw Error('Could not find the dashboard module script');
    }

    const configScriptId = getRequiredAttribute(currentScript, 'data-config-script-id');

    await loadDOM();
    initConfig(configScriptId);
    startApplication();
})();
