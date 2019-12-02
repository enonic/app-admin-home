import * as $ from 'jquery';
// Polyfills added for compatibility with IE11
import 'promise-polyfill/src/polyfill';
import 'whatwg-fetch';
// End of Polyfills
import {KeyBinding} from 'lib-admin-ui/ui/KeyBinding';
import {KeyBindings} from 'lib-admin-ui/ui/KeyBindings';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ApplicationEvent, ApplicationEventType} from 'lib-admin-ui/application/ApplicationEvent';
import {validateConfig} from '../validator';

const config = Object.freeze(Object.assign({}, CONFIG));

let launcherPanel: HTMLElement;
let launcherButton: HTMLElement;
let launcherMainContainer: HTMLElement;

const appendLauncherButton = () => {
    launcherButton = document.createElement('button');
    launcherButton.setAttribute('class', 'launcher-button ' + getColorClass());
    launcherButton.hidden = true;

    const span = document.createElement('span');
    span.setAttribute('class', 'lines');
    launcherButton.appendChild(span);

    launcherButton.addEventListener('click', togglePanelState);

    const container = document.querySelector('.appbar') || document.body;
    container.appendChild(launcherButton);

    setTimeout(() => {
        launcherButton.focus();
    }, 1200);
};

const getColorClass = () => config.launcherButtonCls || '';

const isPanelExpanded = () => launcherPanel.classList.contains('visible');

const togglePanelState = () => isPanelExpanded() ? closeLauncherPanel() : openLauncherPanel();

const toggleButton = () => {
    launcherButton.classList.toggle('toggled');
    launcherButton.focus();
};

const launcherButtonHasFocus = () => document.activeElement === launcherButton;

const fetchLauncherContents = () =>
    fetch(config.launcherUrl)
        .then(response => response.text())
        .then((html: string) => {
            const div = document.createElement('div');
            div.innerHTML = html;
            return div.firstChild;
        })
        .catch(err => {
            throw new Error('Failed to fetch page: ' + err);
        });


const appendLauncherPanel = () => {
    const container = document.createElement('div');
    container.setAttribute('class', 'launcher-panel');
    container.classList.add('hidden');

    fetchLauncherContents()
        .then((launcherEl: HTMLElement) => {
            container.appendChild(launcherEl);
            launcherMainContainer = <HTMLElement>container.firstChild;
            launcherButton.hidden = false;
            launcherMainContainer.setAttribute('hidden', 'true');
            if (config.appId === 'home') {
                launcherMainContainer.classList.add('home');
            }
            document.body.appendChild(container);
            addLongClickHandler(container);

            if (config.autoOpenLauncher) {
                openLauncherPanel();
                launcherButton.focus();
            } else {
                const appTiles = container
                    .querySelector('.launcher-app-container')
                    .querySelectorAll('a');
                for (let i = 0; i < appTiles.length; i++) {
                    appTiles[i].addEventListener('click', () => closeLauncherPanel(true));
                }
            }
            highlightActiveApp();
        });

    launcherPanel = container;
};

const onLauncherClick = (e: MouseEvent) => {
    if (!launcherPanel || !launcherMainContainer) {
        return;
    }
    const isClickOutside =
        !launcherPanel.contains(<Node>e.target) && !launcherButton.contains(<Node>e.target);
    if (
        isClickOutside &&
        !launcherMainContainer.getAttribute('hidden') &&
        !isModalDialogActiveOnHomePage(e.target) &&
        !isDashboardIcon(e.target)
    ) {
        closeLauncherPanel();
    }
};

const isDashboardIcon = (element: EventTarget) => $(element).closest('.dashboard-item').length > 0;

const isModalDialogActiveOnHomePage = (element: EventTarget) =>
    (
        config.appId === 'home' &&
        (document.body.classList.contains('modal-dialog') ||
            $(element).closest('.xp-admin-common-modal-dialog').length > 0)
    );

const openWindow = (windowArr: Window[], anchorEl: HTMLAnchorElement) => {
    const windowId = anchorEl.getAttribute('data-id');

    if (windowArr[windowId] && !windowArr[windowId].closed) {
        windowArr[windowId].focus();
    } else {
        // eslint-disable-next-line no-param-reassign
        windowArr[windowId] = window.open(anchorEl.href, windowId);
    }
};

const addLongClickHandler = (container: HTMLElement) => {
    let longpress = false;
    let startTime;
    let endTime;
    let toolWindows: Window[] = [];

    const appTiles = container
        .querySelector('.launcher-app-container')
        .querySelectorAll('a');
    for (let i = 0; i < appTiles.length; i++) {
        // eslint-disable-next-line no-loop-func
        appTiles[i].addEventListener('click', e => {
            if (
                config.appId ===
                (<Element>e.currentTarget).getAttribute('data-id') &&
                config.appId === 'home'
            ) {
                e.preventDefault();
                return;
            }

            if (longpress) {
                e.preventDefault();
                // tslint:disable-next-line:no-invalid-this
                document.location.href = (<Element>e.currentTarget).getAttribute('href');
            } else if (navigator.userAgent.search('Chrome') > -1) {
                e.preventDefault();
                openWindow(toolWindows, <HTMLAnchorElement>e.currentTarget);
            }
        });
        // eslint-disable-next-line no-loop-func
        appTiles[i].addEventListener('mousedown', () => {
            startTime = new Date().getTime();
        });
        // eslint-disable-next-line no-loop-func
        appTiles[i].addEventListener('mouseup', () => {
            endTime = new Date().getTime();
            longpress = endTime - startTime >= 500;
        });
    }
};

const openLauncherPanel = () => {
    launcherMainContainer.removeAttribute('hidden');
    listenToKeyboardEvents();
    toggleButton();
    launcherPanel.classList.remove('hidden', 'slideout');
    launcherPanel.classList.add('visible');
    document.addEventListener('click', onLauncherClick);
};

const closeLauncherPanel = (skipTransition?: boolean) => {
    document.removeEventListener('click', onLauncherClick);
    launcherMainContainer.setAttribute('hidden', 'true');
    unlistenToKeyboardEvents();
    launcherPanel.classList.remove('visible');
    launcherPanel.classList.add(
        skipTransition === true ? 'hidden' : 'slideout'
    );
    toggleButton();
    unselectCurrentApp();
};

const closeLauncher = new KeyBinding('esc')
    .setGlobal(true)
    .setCallback(e => {
        if (!isPanelExpanded()) {
            return;
        }
        e.preventDefault();
        e.returnValue = false;

        closeLauncherPanel();

        return false;
    });

const prevApp = new KeyBinding('up')
    .setGlobal(true)
    .setCallback(() => {
        if (isPanelExpanded()) {

            initKeyboardNavigation();
            selectPreviousApp();
        }
        return false;
    });

const nextApp = new KeyBinding('down')
    .setGlobal(true)
    .setCallback(e => {
        if (isPanelExpanded()) {
            e.preventDefault();
            e.returnValue = false;

            initKeyboardNavigation();
            selectNextApp();
        }

        return false;
    });

const runApp = new KeyBinding('enter')
    .setGlobal(true)
    .setCallback(e => {
        if (isPanelExpanded()) {
            e.preventDefault();
            e.returnValue = false;

            const selectedApp = getSelectedApp();
            if (selectedApp) {
                startApp(selectedApp);
            } else if (launcherButtonHasFocus()) {
              closeLauncherPanel();
            }
        }
        return false;
    });

const launcherBindings = [closeLauncher, prevApp, nextApp, runApp];

const listenToKeyboardEvents = () => KeyBindings.get().bindKeys(launcherBindings);

const unlistenToKeyboardEvents = () => KeyBindings.get().unbindKeys(launcherBindings);

const unselectCurrentApp = () => {
    const selectedApp = getSelectedApp();
    if (selectedApp) {
        selectedApp.classList.remove('selected');
    }
};

const highlightActiveApp = () => {
    if (!config.appId) {
        return;
    }
    const appRows = launcherPanel.querySelectorAll('.app-row');
    for (let i = 0; i < appRows.length; i++) {
        if (appRows[i].id === config.appId) {
            appRows[i].classList.add('active');
        }
    }
};

const addApplicationsListeners = () => {
    if (!initApplicationsListeners()) {
        let triesLeft = 3;
        const intervalID = setInterval(() => {
            const initialized = initApplicationsListeners();
            if (!initialized && triesLeft > 0) {
                triesLeft -= 1;
            } else {
                clearInterval(intervalID);
            }
        }, 3000);
    }
};

const reloadLauncher = AppHelper.debounce(
    () =>
        fetchLauncherContents()
            .then((launcherEl: HTMLElement) => {
                const oldLauncherContent = launcherPanel.querySelector(
                    '.scrollable-content'
                );

                const newLauncherContent = launcherEl.querySelector(
                    '.scrollable-content'
                );
                const parent = oldLauncherContent.parentNode;
                parent.replaceChild(newLauncherContent, oldLauncherContent);
                highlightActiveApp();
            })
    ,
    1000,
    false
);

const initApplicationsListeners = () => {
    if (ApplicationEvent) {
        ApplicationEvent.on(e => {
            const statusChanged =
                ApplicationEventType.STARTED === e.getEventType() ||
                ApplicationEventType.STOPPED === e.getEventType();
            if (statusChanged) {
                reloadLauncher();
            }
        });
        return true;
    }
    return false;
};

const listenToMouseMove = () => {
    window.addEventListener('mousemove', disableKeyboardNavigation, true);
};

const disableKeyboardNavigation = () => {
    getLauncherMainContainer().classList.remove('keyboard-navigation');
    unselectCurrentApp();
    window.removeEventListener('mousemove', disableKeyboardNavigation, true);
};

const initKeyboardNavigation = () => {
    const appContainer = getLauncherMainContainer();
    if (!appContainer.classList.contains('keyboard-navigation')) {
        listenToMouseMove();
        appContainer.classList.add('keyboard-navigation');
    }
};

const getSelectedApp = (): HTMLElement => launcherPanel.querySelector('.app-row.selected');

const getSelectedAppIndex = () => {
    const apps = getLauncherMainContainer().querySelectorAll('.app-row');
    for (let i = 0; i < apps.length; i++) {
        if (apps[i].classList.contains('selected')) {
            return i;
        }
    }
    return -1;
};

const selectNextApp = () => {
    const firstAppIndex = isHomeAppActive() ? 1 : 0;
    const selectedIndex = getSelectedAppIndex();
    const apps = getLauncherMainContainer().querySelectorAll('.app-row');

    selectApp(
        selectedIndex + 1 === apps.length || selectedIndex === -1
            ? firstAppIndex
            : selectedIndex + 1
    );
};

const selectPreviousApp = () => {
    const selectedIndex = getSelectedAppIndex();
    let nextIndex;
    if (selectedIndex === -1) {
        nextIndex = isHomeAppActive() ? 1 : 0;
    } else if (
        selectedIndex === 0 ||
        (selectedIndex === 1 && isHomeAppActive())
    ) {
        nextIndex = document.querySelectorAll('.app-row').length - 1;
    } else {
        nextIndex = selectedIndex - 1;
    }

    selectApp(nextIndex);
};

const selectApp = (index: number) => {
    unselectCurrentApp();
    getAppByIndex(index).classList.add('selected');
};

const getAppByIndex = (index: number) => {
    const apps = getLauncherMainContainer().querySelectorAll('.app-row');
    for (let i = 0; i < apps.length; i++) {
        if (i === index) {
            return apps[i];
        }
    }
    return null;
};

const startApp = (app: HTMLElement) => {
    const anchorEl = app.parentElement;
    if (anchorEl && anchorEl.tagName === 'A' && anchorEl.click) {
        unselectCurrentApp();
        anchorEl.click();
    }
};

const getLauncherMainContainer = () => launcherMainContainer || document.querySelector('.launcher-main-container');

const isHomeAppActive = () => getLauncherMainContainer().classList.contains('home');

export const init = () => {
    const {valid, errors} = validateConfig(config);
    if (!valid) {
        throw new Error(errors.join('\n'));
    }
    if (config.launcherUrl == null) {
        throw new Error('Launcher URL is not defined.');
    }

    appendLauncherButton();
    appendLauncherPanel();
    addApplicationsListeners();
};
