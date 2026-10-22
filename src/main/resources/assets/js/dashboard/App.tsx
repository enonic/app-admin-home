import {AppRoot} from '@enonic/ui';
import {loadAdminMenu, type AdminMenu} from '@enonic/ui-utils/admin-menu';
import {useEffect, useState} from 'preact/hooks';
import type {DashboardConfig} from '../shared/config';
import {connectHub} from '../shared/hub';
import {i18n} from '../shared/i18n';
import {NotificationList} from '../shared/NotificationList';
import {dismiss, notify} from '../shared/notifications';
import {useTheme} from '../shared/theme';
import {DashboardPanel} from './DashboardPanel';

const RELOAD_DEBOUNCE_MS = 250;

const CONNECTION_LOSS_DELAY_MS = 1000;

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
    let connectionNotice: number | undefined;
    let sessionEnded = false;

    const hideConnectionNotice = (): void => {
        clearTimeout(lossTimer);
        if (connectionNotice !== undefined) {
            dismiss(connectionNotice);
            connectionNotice = undefined;
        }
    };

    connectHub(config.eventsUrl, [config.eventsTopic], {
        onTopic: () => {
            clearTimeout(reloadTimer);
            reloadTimer = setTimeout(onToolsChanged, RELOAD_DEBOUNCE_MS);
        },
        onConnectionChange: (connected) => {
            if (sessionEnded) {
                return;
            }
            hideConnectionNotice();
            if (!connected) {
                lossTimer = setTimeout(() => {
                    connectionNotice = notify('error', i18n('notify.connection.loss'));
                }, CONNECTION_LOSS_DELAY_MS);
            }
        },
        onSessionEnd: () => {
            sessionEnded = true;
            hideConnectionNotice();
            connectionNotice = notify('error', i18n('notify.session.expired'), [
                {label: i18n('action.refresh'), onClick: () => window.location.reload()},
            ]);
        },
    });

    return () => {
        clearTimeout(reloadTimer);
        hideConnectionNotice();
    };
};

export const App = ({config}: {config: DashboardConfig}) => {
    const theme = useTheme();
    const [generation, setGeneration] = useState(0);

    useEffect(() => mountMenu(config), [config]);
    useEffect(() => startHub(config, () => setGeneration(current => current + 1)), [config]);

    return (
        <AppRoot theme={theme} className="h-full">
            <DashboardPanel config={config} generation={generation}/>
            <NotificationList/>
        </AppRoot>
    );
};
