import ApplicationEventType = api.application.ApplicationEventType;
import 'webcomponentsjs/lite';

const launcherUrl = (CONFIG && CONFIG.launcherUrl) || null;
const autoOpenLauncher = CONFIG && CONFIG.autoOpenLauncher;
const appId = CONFIG ? CONFIG.appId : '';

let launcherPanel;
let launcherButton;
let launcherMainContainer;

function appendLauncherButton() {
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
}

function getColorClass() {
    const darkBackground =
        document.querySelector('.appbar') ||
        document.querySelector('.home-main-container');
    return darkBackground ? '' : 'dark';
}

function isPanelExpanded() {
    return launcherPanel.classList.contains('visible');
}

function togglePanelState() {
    if (isPanelExpanded()) {
        closeLauncherPanel();
    } else {
        openLauncherPanel();
    }
}

function toggleButton() {
    launcherButton.classList.toggle('toggled');
    launcherButton.focus();
}

function appendLauncherPanel() {
    const div = document.createElement('div');
    div.setAttribute('class', 'launcher-panel');
    div.classList.add('hidden');
    div.appendChild(createLauncherLink(div));

    document.body.appendChild(div);

    launcherPanel = div;
}

function onLauncherClick(e) {
    if (!launcherPanel || !launcherMainContainer) {
        return;
    }
    const isClickOutside =
        !launcherPanel.contains(e.target) && !launcherButton.contains(e.target);
    if (
        isClickOutside &&
        !launcherMainContainer.getAttribute('hidden') &&
        !isModalDialogActiveOnHomePage(e.target) &&
        !isDashboardIcon(e.target)
    ) {
        closeLauncherPanel();
    }
}

function isDashboardIcon(element) {
    return wemjq(element).closest('.dashboard-item').length > 0;
}

function isModalDialogActiveOnHomePage(element) {
    return (
        CONFIG.appId === 'home' &&
        (document.body.classList.contains('modal-dialog') ||
            wemjq(element).closest('.xp-admin-common-modal-dialog').length > 0)
    );
}

function loadLauncher(onload) {
    const link = document.createElement('link');
    const url = launcherUrl + '?t=' + Date.now();

    link.setAttribute('rel', 'import');
    link.setAttribute('href', url);
    link.setAttribute('async', '');

    link.onload = onload;

    return link;
}

function createLauncherLink(container) {
    let link;

    function onload() {
        launcherButton.hidden = false;
        launcherMainContainer = link.import.querySelector(
            '.launcher-main-container'
        );
        launcherMainContainer.setAttribute('hidden', 'true');
        if (CONFIG.appId === 'home') {
            launcherMainContainer.classList.add('home');
        }
        container.appendChild(launcherMainContainer);
        addLongClickHandler(container);

        if (autoOpenLauncher) {
            openLauncherPanel();
            launcherButton.focus();
        } else {
            const appTiles = container
                .querySelector('.launcher-app-container')
                .querySelectorAll('a');
            for (let i = 0; i < appTiles.length; i++) {
                appTiles[i].addEventListener(
                    'click',
                    closeLauncherPanel.bind(this, true)
                );
            }
        }
        highlightActiveApp();
    }

    link = loadLauncher(onload);

    return link;
}

function openWindow(windowArr, anchorEl) {
    const windowId = anchorEl.getAttribute('data-id');

    if (windowArr[windowId] && !windowArr[windowId].closed) {
        windowArr[windowId].focus();
    } else {
        // eslint-disable-next-line no-param-reassign
        windowArr[windowId] = window.open(anchorEl.href, windowId);
    }
}

function addLongClickHandler(container) {
    let longpress = false;
    let startTime;
    let endTime;
    let toolWindows = [];

    const appTiles = container
        .querySelector('.launcher-app-container')
        .querySelectorAll('a');
    for (let i = 0; i < appTiles.length; i++) {
        // eslint-disable-next-line no-loop-func
        appTiles[i].addEventListener('click', e => {
            if (
                CONFIG.appId ===
                e.currentTarget.getAttribute('data-id') &&
                CONFIG.appId === 'home'
            ) {
                e.preventDefault();
                return;
            }

            if (longpress) {
                e.preventDefault();
                document.location.href = this.href;
            } else if (navigator.userAgent.search('Chrome') > -1) {
                e.preventDefault();
                openWindow(toolWindows, e.currentTarget);
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
}

function openLauncherPanel() {
    launcherMainContainer.removeAttribute('hidden');
    listenToKeyboardEvents();
    toggleButton();
    launcherPanel.classList.remove('hidden', 'slideout');
    launcherPanel.classList.add('visible');
    document.addEventListener('click', onLauncherClick);
}

function closeLauncherPanel(skipTransition?: boolean) {
    document.removeEventListener('click', onLauncherClick);
    launcherMainContainer.setAttribute('hidden', 'true');
    unlistenToKeyboardEvents();
    launcherPanel.classList.remove('visible');
    launcherPanel.classList.add(
        skipTransition === true ? 'hidden' : 'slideout'
    );
    toggleButton();
    unselectCurrentApp();
}

const closeLauncher = new api.ui.KeyBinding('esc')
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
const prevApp = new api.ui.KeyBinding('up')
    .setGlobal(true)
    .setCallback(() => {
        if (isPanelExpanded()) {

            initKeyboardNavigation();
            selectPreviousApp();
        }
        return false;
    });
const nextApp = new api.ui.KeyBinding('down')
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
var runApp = new api.ui.KeyBinding('enter')
    .setGlobal(true)
    .setCallback(e => {
        if (isPanelExpanded()) {
            e.preventDefault();
            e.returnValue = false;

            const selectedApp = getSelectedApp();
            if (selectedApp) {
                startApp(selectedApp);
            }
        }
        return false;
    });
const launcherBindings = [closeLauncher, prevApp, nextApp, runApp];

function listenToKeyboardEvents() {
    api.ui.KeyBindings.get().bindKeys(launcherBindings);
}

function unlistenToKeyboardEvents() {
    api.ui.KeyBindings.get().unbindKeys(launcherBindings);
}

function unselectCurrentApp() {
    const selectedApp = getSelectedApp();
    if (selectedApp) {
        selectedApp.classList.remove('selected');
    }
}

function highlightActiveApp() {
    if (!appId) {
        return;
    }
    const appRows = launcherPanel.querySelectorAll('.app-row');
    for (let i = 0; i < appRows.length; i++) {
        if (appRows[i].id === appId) {
            appRows[i].classList.add('active');
        }
    }
}

function addApplicationsListeners() {
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
}

const reloadLauncher = api.util.AppHelper.debounce(
    () => {
        let link;

        function onload() {
            const oldLauncherContent = launcherPanel.querySelector(
                '.scrollable-content'
            );
            const newLauncherContent = link.import.querySelector(
                '.scrollable-content'
            );
            const parent = oldLauncherContent.parentNode;
            parent.replaceChild(newLauncherContent, oldLauncherContent);
            link.remove();
            highlightActiveApp();
        }

        link = loadLauncher(onload);

        launcherPanel.appendChild(link);
    },
    1000,
    false
);

function initApplicationsListeners() {
    if (api.application.ApplicationEvent) {
        api.application.ApplicationEvent.on(e => {
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
}

function listenToMouseMove() {
    window.addEventListener('mousemove', disableKeyboardNavigation, true);
}

function disableKeyboardNavigation() {
    getLauncherMainContainer().classList.remove('keyboard-navigation');
    unselectCurrentApp();
    window.removeEventListener('mousemove', disableKeyboardNavigation, true);
}

function initKeyboardNavigation() {
    const appContainer = getLauncherMainContainer();
    if (!appContainer.classList.contains('keyboard-navigation')) {
        listenToMouseMove();
        appContainer.classList.add('keyboard-navigation');
    }
}

function getSelectedApp() {
    return launcherPanel.querySelector('.app-row.selected');
}

function getSelectedAppIndex() {
    const apps = getLauncherMainContainer().querySelectorAll('.app-row');
    for (let i = 0; i < apps.length; i++) {
        if (apps[i].classList.contains('selected')) {
            return i;
        }
    }
    return -1;
}

function selectNextApp() {
    const firstAppIndex = isHomeAppActive() ? 1 : 0;
    const selectedIndex = getSelectedAppIndex();
    const apps = getLauncherMainContainer().querySelectorAll('.app-row');

    selectApp(
        selectedIndex + 1 === apps.length || selectedIndex === -1
            ? firstAppIndex
            : selectedIndex + 1
    );
}

function selectPreviousApp() {
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
}

function selectApp(index) {
    unselectCurrentApp();
    getAppByIndex(index).classList.add('selected');
}

function getAppByIndex(index) {
    const apps = getLauncherMainContainer().querySelectorAll('.app-row');
    for (let i = 0; i < apps.length; i++) {
        if (i === index) {
            return apps[i];
        }
    }
    return null;
}

function startApp(app) {
    const anchorEl = app.parentElement;
    if (anchorEl && anchorEl.tagName === 'A' && anchorEl.click) {
        unselectCurrentApp();
        anchorEl.click();
    }
}

function getLauncherMainContainer() {
    if (!launcherMainContainer) {
        launcherMainContainer = document.querySelector(
            '.launcher-main-container'
        );
    }

    return launcherMainContainer;
}

function isHomeAppActive() {
    return getLauncherMainContainer().classList.contains('home');
}

export function init() {
    if (launcherUrl == null) {
        throw new Error('CONFIG.launcherUrl is not defined');
    }

    appendLauncherButton();
    appendLauncherPanel();
    addApplicationsListeners();
}
