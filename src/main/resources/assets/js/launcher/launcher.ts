import ApplicationEventType = api.application.ApplicationEventType;
import 'webcomponentsjs/lite';

var launcherUrl = (CONFIG && CONFIG.launcherUrl) || null;
var autoOpenLauncher = CONFIG && CONFIG.autoOpenLauncher;
var appId = CONFIG ? CONFIG.appId : '';

var launcherPanel;
var launcherButton;
var launcherMainContainer;

function appendLauncherButton() {
    launcherButton = document.createElement('button');
    launcherButton.setAttribute('class', 'launcher-button ' + getColorClass());
    launcherButton.hidden = true;

    var span = document.createElement('span');
    span.setAttribute('class', 'lines');
    launcherButton.appendChild(span);

    launcherButton.addEventListener('click', togglePanelState);

    var container = document.querySelector('.appbar') || document.body;
    container.appendChild(launcherButton);

    setTimeout(() => {
        launcherButton.focus();
    }, 1200);
}

function getColorClass() {
    var darkBackground =
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
    var div = document.createElement('div');
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
    var isClickOutside =
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
    var link = document.createElement('link');
    var url = launcherUrl + '?t=' + Date.now();

    link.setAttribute('rel', 'import');
    link.setAttribute('href', url);
    link.setAttribute('async', '');

    link.onload = onload;

    return link;
}

function createLauncherLink(container) {
    var link;

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
            var appTiles = container
                .querySelector('.launcher-app-container')
                .querySelectorAll('a');
            for (var i = 0; i < appTiles.length; i++) {
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
    var windowId = anchorEl.getAttribute('data-id');

    if (windowArr[windowId] && !windowArr[windowId].closed) {
        windowArr[windowId].focus();
    } else {
        // eslint-disable-next-line no-param-reassign
        windowArr[windowId] = window.open(anchorEl.href, windowId);
    }
}

function addLongClickHandler(container) {
    var longpress = false;
    var startTime;
    var endTime;
    var toolWindows = [];

    var appTiles = container
        .querySelector('.launcher-app-container')
        .querySelectorAll('a');
    for (var i = 0; i < appTiles.length; i++) {
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

var closeLauncher = new api.ui.KeyBinding('esc')
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
var prevApp = new api.ui.KeyBinding('up')
    .setGlobal(true)
    .setCallback(() => {
        if (isPanelExpanded()) {

            initKeyboardNavigation();
            selectPreviousApp();
        }
        return false;
    });
var nextApp = new api.ui.KeyBinding('down')
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

            var selectedApp = getSelectedApp();
            if (selectedApp) {
                startApp(selectedApp);
            }
        }
        return false;
    });
var launcherBindings = [closeLauncher, prevApp, nextApp, runApp];

function listenToKeyboardEvents() {
    api.ui.KeyBindings.get().bindKeys(launcherBindings);
}

function unlistenToKeyboardEvents() {
    api.ui.KeyBindings.get().unbindKeys(launcherBindings);
}

function unselectCurrentApp() {
    var selectedApp = getSelectedApp();
    if (selectedApp) {
        selectedApp.classList.remove('selected');
    }
}

function highlightActiveApp() {
    if (!appId) {
        return;
    }
    var appRows = launcherPanel.querySelectorAll('.app-row');
    for (var i = 0; i < appRows.length; i++) {
        if (appRows[i].id === appId) {
            appRows[i].classList.add('active');
        }
    }
}

function addApplicationsListeners() {
    if (!initApplicationsListeners()) {
        var triesLeft = 3;
        var intervalID = setInterval(() => {
            var initialized = initApplicationsListeners();
            if (!initialized && triesLeft > 0) {
                triesLeft -= 1;
            } else {
                clearInterval(intervalID);
            }
        }, 3000);
    }
}

var reloadLauncher = api.util.AppHelper.debounce(
    () => {
        var link;

        function onload() {
            var oldLauncherContent = launcherPanel.querySelector(
                '.scrollable-content'
            );
            var newLauncherContent = link.import.querySelector(
                '.scrollable-content'
            );
            var parent = oldLauncherContent.parentNode;
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
            var statusChanged =
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
    var appContainer = getLauncherMainContainer();
    if (!appContainer.classList.contains('keyboard-navigation')) {
        listenToMouseMove();
        appContainer.classList.add('keyboard-navigation');
    }
}

function getSelectedApp() {
    return launcherPanel.querySelector('.app-row.selected');
}

function getSelectedAppIndex() {
    var apps = getLauncherMainContainer().querySelectorAll('.app-row');
    for (var i = 0; i < apps.length; i++) {
        if (apps[i].classList.contains('selected')) {
            return i;
        }
    }
    return -1;
}

function selectNextApp() {
    var firstAppIndex = isHomeAppActive() ? 1 : 0;
    var selectedIndex = getSelectedAppIndex();
    var apps = getLauncherMainContainer().querySelectorAll('.app-row');

    selectApp(
        selectedIndex + 1 === apps.length || selectedIndex === -1
            ? firstAppIndex
            : selectedIndex + 1
    );
}

function selectPreviousApp() {
    var selectedIndex = getSelectedAppIndex();
    var nextIndex;
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
    var apps = getLauncherMainContainer().querySelectorAll('.app-row');
    for (var i = 0; i < apps.length; i++) {
        if (i === index) {
            return apps[i];
        }
    }
    return null;
}

function startApp(app) {
    var anchorEl = app.parentElement;
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
