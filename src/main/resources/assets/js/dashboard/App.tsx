import {AppRoot, I18nProvider} from '@enonic/ui';
import {NotificationList} from '@enonic/ui-kit';
import {createNotifications} from '@enonic/ui-utils';
import {loadAdminMenu, type AdminMenu} from '@enonic/ui-utils/admin-menu';
import {createAdminEvents} from '@enonic/ui-utils/admin-events';
import {useEffect, useState} from 'preact/hooks';
import type {DashboardConfig} from '../shared/config';
import {i18n, translate} from '../shared/i18n';
import {useTheme} from '../shared/theme';
import {DashboardPanel} from './DashboardPanel';

const RELOAD_DEBOUNCE_MS = 250;

const CONNECTION_LOSS_DELAY_MS = 1000;

const NOTIFICATIONS_POSITION = 'fixed right-0 bottom-0 z-60 w-full px-2 pb-2 sm:right-9 sm:bottom-6 sm:max-w-115 sm:p-0';

const notifications = createNotifications();

const reveal = (): void => {
    document.getElementById('home-main-container')?.classList.add('visible');
    document.querySelector('xp-menu')?.classList.add('transparent');
};

// home.html loads the loader itself, so the helper finds the api on the window; it fetches the loader again only when that script failed
const mountMenu = (config: DashboardConfig): (() => void) => {
    let active = true;
    let menu: AdminMenu | undefined;
    if (config.autoOpen) {
        document.addEventListener('menu-background-ready', reveal, {once: true});
        document.addEventListener('menu-panel-closed', reveal, {once: true});
    }
    loadAdminMenu(config.menuLoaderUrl)
        .then(loaded => {
            if (!active) {
                return;
            }
            menu = loaded;
            return menu.mount({autoOpen: config.autoOpen, hideButtonWhenOpen: config.autoOpen});
        })
        .then(() => {
            if (active && !config.autoOpen) {
                reveal();
            }
        })
        .catch(e => {
            console.error('Failed to mount the menu:', e);
            reveal();
        });
    return () => {
        active = false;
        document.removeEventListener('menu-background-ready', reveal);
        document.removeEventListener('menu-panel-closed', reveal);
        menu?.unmount();
    };
};

const startHub = (config: DashboardConfig, onToolsChanged: () => void): (() => void) => {
    let reloadTimer: ReturnType<typeof setTimeout> | undefined;
    let lossTimer: ReturnType<typeof setTimeout> | undefined;
    let dismissNotice: (() => void) | undefined;
    let sessionEnded = false;

    const hideNotice = (): void => {
        clearTimeout(lossTimer);
        dismissNotice?.();
        dismissNotice = undefined;
    };

    const reload = (): void => {
        clearTimeout(reloadTimer);
        reloadTimer = setTimeout(onToolsChanged, RELOAD_DEBOUNCE_MS);
    };

    const hub = createAdminEvents(config.eventsUrl);
    const unsubscribeTopic = hub.subscribeTopic(config.eventsTopic, {onMessage: reload, onLoss: reload});
    const unsubscribeConnection = hub.subscribeConnection(connected => {
        if (sessionEnded) {
            return;
        }
        hideNotice();
        if (!connected) {
            lossTimer = setTimeout(() => {
                dismissNotice = notifications.notify('error', i18n('notify.connection.loss'), {autoHide: false});
            }, CONNECTION_LOSS_DELAY_MS);
        }
    });
    const unsubscribeSessionEnd = hub.subscribeSessionEnd(() => {
        sessionEnded = true;
        hideNotice();
        dismissNotice = notifications.notify('error', i18n('notify.session.expired'), {
            autoHide: false,
            actions: [{label: i18n('action.refresh'), onClick: () => window.location.reload()}],
        });
    });
    hub.connect();

    return () => {
        clearTimeout(reloadTimer);
        unsubscribeTopic();
        unsubscribeConnection();
        unsubscribeSessionEnd();
        hideNotice();
    };
};

export const App = ({config}: {config: DashboardConfig}) => {
    const theme = useTheme();
    const [generation, setGeneration] = useState(0);

    useEffect(() => mountMenu(config), [config]);
    useEffect(() => startHub(config, () => setGeneration(current => current + 1)), [config]);

    return (
        <I18nProvider translate={translate}>
            <AppRoot theme={theme} className="h-full">
                <DashboardPanel config={config} generation={generation}/>
                <NotificationList notifications={notifications} className={NOTIFICATIONS_POSITION}/>
            </AppRoot>
        </I18nProvider>
    );
};
