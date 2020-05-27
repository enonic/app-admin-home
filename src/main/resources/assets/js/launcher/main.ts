import * as $ from 'jquery';
// Polyfills added for compatibility with IE11
import 'whatwg-fetch';
import 'core-js/features/object';
import 'core-js/features/promise';
// End of Polyfills
import {KeyBinding} from 'lib-admin-ui/ui/KeyBinding';
import {KeyBindings} from 'lib-admin-ui/ui/KeyBindings';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {BrowserHelper} from 'lib-admin-ui/BrowserHelper';
import {ApplicationEvent, ApplicationEventType} from 'lib-admin-ui/application/ApplicationEvent';
import {validateConfig} from '../validator';
import {ThemeManager} from './ThemeManager';
import {i18n} from 'lib-admin-ui/util/Messages';
import {i18nInit} from 'lib-admin-ui/util/MessagesInitializer';

const config = Object.freeze(Object.assign({}, CONFIG));

class LauncherParams {
    private readonly theme: string;
    private readonly customCls: string;
    private readonly container: string;

    constructor(params: LauncherConfig) {
        if (params) {
            this.theme = ThemeManager.getTheme(params.theme);
            this.customCls = params.cls;
            this.container = params.container;
        }
    }

    getTheme(): string {
        return this.theme;
    }

    getCustomCls(): string {
        return this.customCls;
    }

    getContainerSelector(): string {
        return this.container;
    }
}

class Launcher {
    private launcherPanel: HTMLElement;
    private launcherButton: HTMLElement;
    private launcherMainContainer: HTMLElement;

    private closeLauncher: KeyBinding = new KeyBinding('esc')
        .setGlobal(true)
        .setCallback(e => {
            if (!this.isPanelExpanded()) {
                return;
            }
            e.preventDefault();
            e.returnValue = false;

            this.closeLauncherPanel();

            return false;
        });

    private prevApp: KeyBinding = new KeyBinding('up')
        .setGlobal(true)
        .setCallback(() => {
            if (this.isPanelExpanded()) {

                this.initKeyboardNavigation();
                this.selectPreviousApp();
            }
            return false;
        });

    private nextApp: KeyBinding = new KeyBinding('down')
        .setGlobal(true)
        .setCallback(e => {
            if (this.isPanelExpanded()) {
                e.preventDefault();
                e.returnValue = false;

                this.initKeyboardNavigation();
                this.selectNextApp();
            }

            return false;
        });

    private runApp: KeyBinding = new KeyBinding('enter')
        .setGlobal(true)
        .setCallback(e => {
            if (this.isPanelExpanded()) {
                e.preventDefault();
                e.returnValue = false;

                const selectedApp = this.getSelectedApp();
                if (selectedApp) {
                    this.startApp(selectedApp);
                } else if (this.launcherButtonHasFocus()) {
                    this.closeLauncherPanel();
                }
            }
            return false;
        });

    private launcherBindings: KeyBinding[] = [this.closeLauncher, this.prevApp, this.nextApp, this.runApp];

    readonly params: LauncherParams;

    constructor(params?: LauncherParams) {
        this.params = params;
        const {valid, errors} = validateConfig(config);
        if (!valid) {
            throw new Error(errors.join('\n'));
        }

        const delay = BrowserHelper.isIE() ? 500 : 200;

        setTimeout(() => {
            this.appendLauncherButton();
            this.appendLauncherPanel();
            this.addApplicationsListeners();
        }, delay);
    }

    public appendLauncherButton = (): void => {
        const button = document.createElement('button');
        button.setAttribute('title', i18n('tooltip.launcher.openMenu'));
        button.setAttribute('class', `launcher-button ${this.getThemeClass()}`);
        button.hidden = true;

        const spanX = document.createElement('span');
        spanX.setAttribute('class', 'span-x');
        spanX.innerHTML = 'X';
        const spanP = document.createElement('span');
        spanP.setAttribute('class', 'span-p');
        spanP.innerHTML = 'P';
        button.appendChild(spanX);
        button.appendChild(spanP);

        button.addEventListener('click', this.togglePanelState);

        const containerSelector = this.params.getContainerSelector();
        const container = containerSelector ? document.querySelector(containerSelector) : document.body ;
        container.appendChild(button);
        button.classList.add('visible');

        this.launcherButton = button;
    }

    private getThemeClass = (): string => {
        if (this.params.getCustomCls()) {
            return `theme-custom ${this.params.getCustomCls()}`;
        }

        return `theme-${ThemeManager.getTheme(this.params.getTheme())}`;
    }

    private isPanelExpanded = (): boolean => this.launcherPanel.classList.contains('visible');

    private togglePanelState = (): void => this.isPanelExpanded() ? this.closeLauncherPanel() : this.openLauncherPanel();

    private toggleButton = () => {
        this.launcherButton.classList.toggle('toggled');
        this.launcherButton.focus();
    }

    private launcherButtonHasFocus = (): boolean => document.activeElement === this.launcherButton;

    private fetchLauncherContents = (): Promise<ChildNode> => {
        return fetch(config.launcherUrl)
            .then(response => response.text())
            .then((html: string) => {
                const div = document.createElement('div');
                div.innerHTML = html;
                return div.firstChild;
            })
            .catch(err => {
                throw new Error('Failed to fetch page: ' + err);
            });
    }

    private appendLauncherPanel = (): void => {
        const container = document.createElement('div');
        container.setAttribute('class', `launcher-panel ${this.getThemeClass()}`);
        container.classList.add('hidden');

        this.fetchLauncherContents()
            .then((launcherEl: HTMLElement) => {
                container.appendChild(launcherEl);
                this.launcherMainContainer = <HTMLElement>container.firstChild;
                this.launcherButton.hidden = false;
                this.launcherMainContainer.setAttribute('hidden', 'true');
                if (config.appId === 'home') {
                    this.launcherMainContainer.classList.add('home');
                }
                document.body.appendChild(container);
                Launcher.addLongClickHandler(container);

                if (config.autoOpenLauncher) {
                    this.openLauncherPanel();
                    this.launcherButton.focus();
                } else {
                    const appTiles = container
                        .querySelector('.launcher-app-container')
                        .querySelectorAll('a');
                    for (let i = 0; i < appTiles.length; i++) {
                        appTiles[i].addEventListener('click', () => this.closeLauncherPanel(true));
                    }
                }
                this.highlightActiveApp();
            });

        this.launcherPanel = container;
    }

    private onLauncherClick = (e: MouseEvent): void => {
        if (!this.launcherPanel || !this.launcherMainContainer) {
            return;
        }
        const isClickOutside =
            !this.launcherPanel.contains(<Node>e.target) && !this.launcherButton.contains(<Node>e.target);
        if (
            isClickOutside &&
            !this.launcherMainContainer.getAttribute('hidden') &&
            !Launcher.isModalDialogActiveOnHomePage(e.target) &&
            !Launcher.isDashboardIcon(e.target)
        ) {
            this.closeLauncherPanel();
        }
    }

    private static isDashboardIcon = (element: EventTarget) => $(element).closest('.dashboard-item').length > 0;

    private static isModalDialogActiveOnHomePage = (element: EventTarget): boolean => {
        return (
            config.appId === 'home' &&
            (document.body.classList.contains('modal-dialog') ||
             $(element).closest('.xp-admin-common-modal-dialog').length > 0)
        );
    }

    private static openWindow = (windowArr: Window[], anchorEl: HTMLAnchorElement) => {
        const windowId = anchorEl.getAttribute('data-id');

        if (windowArr[windowId] && !windowArr[windowId].closed) {
            windowArr[windowId].focus();
        } else {
            // eslint-disable-next-line no-param-reassign
            windowArr[windowId] = window.open(anchorEl.href, windowId);
        }
    }

    private static addLongClickHandler = (container: HTMLElement): void => {
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
                    Launcher.openWindow(toolWindows, <HTMLAnchorElement>e.currentTarget);
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

    private openLauncherPanel = (): void => {
        this.launcherMainContainer.removeAttribute('hidden');
        this.listenToKeyboardEvents();
        this.toggleButton();
        this.launcherPanel.classList.remove('hidden', 'slideout');
        this.launcherPanel.classList.add('visible');
        this.launcherButton.setAttribute('title', i18n('tooltip.launcher.closeMenu'));

        document.addEventListener('click', this.onLauncherClick);
    }

    private closeLauncherPanel = (skipTransition?: boolean): void => {
        document.removeEventListener('click', this.onLauncherClick);
        this.launcherMainContainer.setAttribute('hidden', 'true');
        this.unlistenToKeyboardEvents();
        this.launcherPanel.classList.remove('visible');
        this.launcherPanel.classList.add(
            skipTransition === true ? 'hidden' : 'slideout'
        );
        this.toggleButton();
        this.launcherButton.setAttribute('title', i18n('tooltip.launcher.openMenu'));
        this.unselectCurrentApp();
    }

    private listenToKeyboardEvents = (): void => KeyBindings.get().bindKeys(this.launcherBindings);

    private unlistenToKeyboardEvents = (): void => KeyBindings.get().unbindKeys(this.launcherBindings);

    private unselectCurrentApp = (): void => {
        const selectedApp = this.getSelectedApp();
        if (selectedApp) {
            selectedApp.classList.remove('selected');
        }
    }

    private highlightActiveApp = (): void => {
        if (!config.appId) {
            return;
        }
        const appRows = this.launcherPanel.querySelectorAll('.app-row');
        for (let i = 0; i < appRows.length; i++) {
            if (appRows[i].id === config.appId) {
                appRows[i].classList.add('active');
            }
        }
    }

    private addApplicationsListeners = (): void => {
        if (!this.initApplicationsListeners()) {
            let triesLeft = 3;
            const intervalID = setInterval(() => {
                const initialized = this.initApplicationsListeners();
                if (!initialized && triesLeft > 0) {
                    triesLeft -= 1;
                } else {
                    clearInterval(intervalID);
                }
            }, 3000);
        }
    }

    private reloadLauncher = (): void => {
        return AppHelper.debounce(
            () =>
                this.fetchLauncherContents()
                    .then((launcherEl: HTMLElement) => {
                        const oldLauncherContent = this.launcherPanel.querySelector(
                            '.scrollable-content'
                        );

                        const newLauncherContent = launcherEl.querySelector(
                            '.scrollable-content'
                        );
                        const parent = oldLauncherContent.parentNode;
                        parent.replaceChild(newLauncherContent, oldLauncherContent);
                        this.highlightActiveApp();
                    })
            ,
            1000,
            false
        )();
    }

    private initApplicationsListeners = (): boolean => {
        if (ApplicationEvent) {
            ApplicationEvent.on(e => {
                const statusChanged =
                    ApplicationEventType.STARTED === e.getEventType() ||
                    ApplicationEventType.STOPPED === e.getEventType();
                if (statusChanged) {
                    this.reloadLauncher();
                }
            });
            return true;
        }
        return false;
    }

    private listenToMouseMove = (): void => window.addEventListener('mousemove', this.disableKeyboardNavigation, true);

    private disableKeyboardNavigation = (): void => {
        this.getLauncherMainContainer().classList.remove('keyboard-navigation');
        this.unselectCurrentApp();
        window.removeEventListener('mousemove', this.disableKeyboardNavigation, true);
    }

    private initKeyboardNavigation = (): void => {
        const appContainer = this.getLauncherMainContainer();
        if (!appContainer.classList.contains('keyboard-navigation')) {
            this.listenToMouseMove();
            appContainer.classList.add('keyboard-navigation');
        }
    }

    private getSelectedApp = (): HTMLElement => this.launcherPanel.querySelector('.app-row.selected');

    private getSelectedAppIndex = (): number => {
        const apps = this.getLauncherMainContainer().querySelectorAll('.app-row');
        for (let i = 0; i < apps.length; i++) {
            if (apps[i].classList.contains('selected')) {
                return i;
            }
        }
        return -1;
    }

    private selectNextApp = (): void => {
        const firstAppIndex = this.isHomeAppActive() ? 1 : 0;
        const selectedIndex = this.getSelectedAppIndex();
        const apps = this.getLauncherMainContainer().querySelectorAll('.app-row');

        this.selectApp(
            selectedIndex + 1 === apps.length || selectedIndex === -1
            ? firstAppIndex
            : selectedIndex + 1
        );
    }

    private selectPreviousApp = (): void => {
        const selectedIndex = this.getSelectedAppIndex();
        let nextIndex;
        if (selectedIndex === -1) {
            nextIndex = this.isHomeAppActive() ? 1 : 0;
        } else if (
            selectedIndex === 0 ||
            (selectedIndex === 1 && this.isHomeAppActive())
        ) {
            nextIndex = document.querySelectorAll('.app-row').length - 1;
        } else {
            nextIndex = selectedIndex - 1;
        }

        this.selectApp(nextIndex);
    }

    private selectApp = (index: number): void => {
        this.unselectCurrentApp();
        this.getAppByIndex(index).classList.add('selected');
    }

    private getAppByIndex = (index: number): Element => {
        const apps = this.getLauncherMainContainer().querySelectorAll('.app-row');
        for (let i = 0; i < apps.length; i++) {
            if (i === index) {
                return apps[i];
            }
        }
        return null;
    }

    private startApp = (app: HTMLElement): void => {
        const anchorEl = app.parentElement;
        if (anchorEl && anchorEl.tagName === 'A' && anchorEl.click) {
            this.unselectCurrentApp();
            anchorEl.click();
        }
    }

    private getLauncherMainContainer = (): HTMLElement => this.launcherMainContainer || document.querySelector('.launcher-main-container');

    private isHomeAppActive = () => this.getLauncherMainContainer().classList.contains('home');
}

const init = async () => {
    const i18nUrl = config.i18nUrl || config.services.i18nUrl;
    if (i18nUrl) {
        await i18nInit(i18nUrl);
    }
    return new Launcher(new LauncherParams(config.launcher));
};

window.addEventListener('load', init);
