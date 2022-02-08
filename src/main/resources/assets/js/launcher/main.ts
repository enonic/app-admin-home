import * as $ from 'jquery';
import {KeyBinding} from 'lib-admin-ui/ui/KeyBinding';
import {KeyBindings} from 'lib-admin-ui/ui/KeyBindings';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ApplicationEvent, ApplicationEventType} from 'lib-admin-ui/application/ApplicationEvent';
import {ThemeManager} from './ThemeManager';
import {i18nFetch} from 'lib-admin-ui/util/MessagesInitializer';

const launcherUrl = '/admin/tool/com.enonic.xp.app.main/launcher';
const i18nServiceUrl = '/admin/tool/_/service/com.enonic.xp.app.main/i18n';
const isHomeApp = document.location.href.endsWith('/admin/tool');

const currentScript = document.currentScript;

interface JSONObject {
    [key: string]: string;
}

let i18nStore: Map<string, string>;

const i18n = (key: string): string => i18nStore.has(key) ? i18nStore.get(key) : `#${key}#`;

class Launcher {
    private launcherPanel: HTMLElement;
    private launcherButton: HTMLElement;
    private launcherMainContainer: HTMLElement;
    private focusableElements: Array<HTMLElement>;

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

    private nextApp: KeyBinding = new KeyBinding('down')
        .setGlobal(true)
        .setCallback((e: Event) => {
            if (!this.isPanelExpanded() || !this.isAppOnFocus()) {
                return false;
            }
            this.initKeyboardNavigation();
            this.selectNextApp();
            return false;
        });

    private prevApp: KeyBinding = new KeyBinding('up')
        .setGlobal(true)
        .setCallback((e: Event) => {
            if (!this.isPanelExpanded() || !this.isAppOnFocus()) {
                return false;
            }
            this.initKeyboardNavigation();
            this.selectPreviousApp();
            return false;
        });


    private tabNextApp: KeyBinding = new KeyBinding('tab')
        .setGlobal(true)
        .setCallback((e: Event) => {
            const desiredIndexIsGreaterThanMaxIndex = this.getSelectedAppIndex() + 1 > this.getApps().length - 1;

            if (!this.isPanelExpanded()
                || desiredIndexIsGreaterThanMaxIndex
                || !this.launcherPanel.contains(this.getNextFocusableElement())) {
                this.unselectCurrentApp();
                return true;
            }

            this.initKeyboardNavigation();
            this.selectNextApp();
            return true;
        });

    private shiftTabPrevApp: KeyBinding = new KeyBinding('shift+tab')
        .setGlobal(true)
        .setCallback((e: Event) => {
            if (!this.isPanelExpanded() || !this.launcherPanel.contains(document.activeElement)) {
                this.unselectCurrentApp();
                return true;
            }

            if (!this.isAppOnFocus()) {
                this.selectApp(this.getApps().length - 1);
                return true;
            }

            const desiredIndexIsLessThanMinIndex = this.getSelectedAppIndex() - 1 < 0;

            if(desiredIndexIsLessThanMinIndex) {
                this.unselectCurrentApp();
                return true;
            }

            this.initKeyboardNavigation();
            this.selectPreviousApp();
            return true;
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

    private launcherBindings: KeyBinding[] = [
        this.closeLauncher,
        this.prevApp,
        this.nextApp,
        this.tabNextApp,
        this.shiftTabPrevApp,
        this.runApp,
    ];

    readonly config: JSONObject;

    constructor(config: JSONObject) {
        this.config = config;

        setTimeout(() => {
            this.appendLauncherButton();
            this.appendLauncherPanel();
            this.addApplicationsListeners();
            this.addAccessibilityListeners();
        }, 200);
    }

    private addAccessibilityListeners = (): void => {
        // Set visibility to hidden after the transition end to avoid
        // keyboard navigation in inner items when the menu is closed
        this.launcherPanel.addEventListener('transitionend', () => {
            const classList = this.launcherPanel.classList;
            if (classList.contains('slideout') || classList.contains('hidden')) {
                this.launcherMainContainer.style.visibility = 'hidden';
            }
        });
    };

    private addAppItemsListeners = (): void => {
        this.getApps().forEach((app: HTMLElement, index:number) => {
            app.addEventListener('mouseenter', () => {
                this.selectApp(index);
            });

            if(index === 0){
                app.parentNode.addEventListener('keydown', (e: KeyboardEvent) => {
                    if(e.key === 'Tab' && e.shiftKey){
                        setTimeout(() => this.launcherButton.focus(), 100);
                    }
                });
            }
        });
    };

    private isAppOnFocus(): boolean {
        const apps = this.getApps();
        return apps.some((app: HTMLElement) => app.classList.contains('selected'));
    }

    private setFocusableElements(): void {
        const tags = ['a', 'button', 'input', 'select', 'textarea', '[tabindex]', '[contenteditable]'];
        const maxTabIndex = 1000;

        const focusable = Array.from(document.querySelectorAll<HTMLElement>(tags.join(', '))) ;

        this.focusableElements = focusable.filter((el: HTMLInputElement) => {
                if(el.disabled || (el.getAttribute('tabindex') && parseInt(el.getAttribute('tabindex')) < 0)) {
                    return false;
                }
                return true;
            })
            .sort((a: HTMLInputElement, b: HTMLInputElement) => {
                const aTabIndex = (parseFloat(a.getAttribute('tabindex') || maxTabIndex.toString()) || maxTabIndex);
                const bTabIndex = (parseFloat(b.getAttribute('tabindex') || maxTabIndex.toString()) || maxTabIndex);
                return aTabIndex - bTabIndex;
            });
    }

    private getNextFocusableElement(): HTMLElement | null {
        const focusIndex = this.focusableElements.indexOf(document.activeElement as HTMLElement);

        return (this.focusableElements[focusIndex + 1])
            ? this.focusableElements[focusIndex + 1]
            : null;
    }

    public appendLauncherButton = (): void => {
        const button = document.createElement('button');
        button.setAttribute('title', i18n('launcher.tooltip.openMenu'));
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
        button.addEventListener('keydown', (e: KeyboardEvent) => {
            if(e.key === 'Tab' && !e.shiftKey){
                e.preventDefault();
                this.selectApp(0);
                return false;
             }
        });

        const containerSelector: string = this.config['container'];
        const container = containerSelector ? document.querySelector(containerSelector) : document.body;
        if (container) {
            container.appendChild(button);
        }
        button.classList.add('visible');

        this.launcherButton = button;
    };

    private getThemeClass = (): string => {
        if (this.config['custom-class']) {
            return `theme-custom ${this.config['custom-class']}`;
        }

        return `theme-${ThemeManager.getTheme(this.config['theme'])}`;
    };

    private isPanelExpanded = (): boolean => this.launcherPanel.classList.contains('visible');

    private togglePanelState = (): void => this.isPanelExpanded() ? this.closeLauncherPanel() : this.openLauncherPanel();

    private toggleButton = () => {
        this.launcherButton.classList.toggle('toggled');
        this.launcherButton.focus();
    };

    private launcherButtonHasFocus = (): boolean => document.activeElement === this.launcherButton;

    private fetchLauncherContents = (): Promise<ChildNode> => {
        return fetch(launcherUrl)
            .then(response => response.text())
            .then((html: string) => {
                const div = document.createElement('div');
                div.innerHTML = html;
                return div.firstChild;
            })
            .catch((e: Error) => {
                throw new Error(`Failed to fetch page: ${e.toString()}`);
            });
    };

    private appendLauncherPanel = (): void => {
        const container = document.createElement('div');
        container.setAttribute('class', `launcher-panel ${this.getThemeClass()}`);
        container.setAttribute('tabindex', '0');
        container.classList.add('hidden');

        void this.fetchLauncherContents()
            .then((launcherEl: HTMLElement) => {
                container.appendChild(launcherEl);
                this.launcherMainContainer = <HTMLElement>container.firstChild;
                this.launcherButton.hidden = false;
                this.launcherMainContainer.setAttribute('hidden', 'true');
                if (isHomeApp) {
                    this.launcherMainContainer.classList.add('home');
                }
                document.body.appendChild(container);
                Launcher.addLongClickHandler(container);

                if (this.config['autoOpenLauncher'] === 'true') {
                    this.openLauncherPanel();
                } else {
                    const appTiles = container
                        .querySelector('.launcher-app-container')
                        .querySelectorAll('a');
                    for (let i = 0; i < appTiles.length; i++) {
                        appTiles[i].addEventListener('click', () => this.closeLauncherPanel(true));
                    }
                }
                this.highlightActiveApp();
                this.addAppItemsListeners();
                this.setFocusableElements();
            });

        this.launcherPanel = container;
    };

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
    };

    private static isDashboardIcon = (element: EventTarget) => $(element).closest('.dashboard-item').length > 0;

    private static isModalDialogActiveOnHomePage = (element: EventTarget): boolean => {
        return (
            isHomeApp &&
            (document.body.classList.contains('modal-dialog') ||
             $(element).closest('.xp-admin-common-modal-dialog').length > 0)
        );
    };

    private static openWindow = (windowArr: Window[], anchorEl: HTMLAnchorElement) => {
        const windowId = anchorEl.getAttribute('data-id');

        if (windowArr[windowId] && !(windowArr[windowId] as Window).closed) {
            (windowArr[windowId] as Window).focus();
        } else {
            // eslint-disable-next-line no-param-reassign
            windowArr[windowId] = window.open(anchorEl.href, windowId);
        }
    };

    private static addLongClickHandler = (container: HTMLElement): void => {
        let longpress = false;
        let startTime;
        let endTime;
        const toolWindows: Window[] = [];

        const appTiles = container
            .querySelector('.launcher-app-container')
            .querySelectorAll('a');
        for (let i = 0; i < appTiles.length; i++) {
            // eslint-disable-next-line no-loop-func
            appTiles[i].addEventListener('click', e => {
                if (isHomeApp && (<Element>e.currentTarget).getAttribute('data-id') === 'home') {
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
    };

    private openLauncherPanel = (): void => {
        this.launcherMainContainer.removeAttribute('hidden');
        this.launcherMainContainer.style.visibility = 'visible';
        this.listenToKeyboardEvents();
        this.toggleButton();
        this.launcherPanel.classList.remove('hidden', 'slideout');
        this.launcherPanel.classList.add('visible');
        this.launcherButton.setAttribute('title', i18n('launcher.tooltip.closeMenu'));
        this.launcherButton.focus();
        document.addEventListener('click', this.onLauncherClick);
    };

    private closeLauncherPanel = (skipTransition?: boolean): void => {
        document.removeEventListener('click', this.onLauncherClick);
        this.launcherMainContainer.setAttribute('hidden', 'true');
        this.unlistenToKeyboardEvents();
        this.launcherPanel.classList.remove('visible');
        this.launcherPanel.classList.add(
            skipTransition === true ? 'hidden' : 'slideout',
        );
        this.toggleButton();
        this.launcherButton.setAttribute('title', i18n('launcher.tooltip.openMenu'));
        this.unselectCurrentApp();
    };

    private listenToKeyboardEvents = (): void => KeyBindings.get().bindKeys(this.launcherBindings);

    private unlistenToKeyboardEvents = (): void => KeyBindings.get().unbindKeys(this.launcherBindings);

    private unselectCurrentApp = (): void => {
        const selectedApp = this.getSelectedApp();
        if (selectedApp) {
            selectedApp.classList.remove('selected');
        }
    };

    private highlightActiveApp = (): void => {
        const appRows = this.launcherPanel.querySelectorAll('.app-row');
        for (let i = 0; i < appRows.length; i++) {
            if ((appRows[i].id === 'home' && isHomeApp) ||
                document.location.href.includes(`/${appRows[i].id}/`)) {
                appRows[i].classList.add('active');
            }
        }
    };

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
    };

    private reloadLauncher = (): void => {
        return AppHelper.debounce(
            () =>
                this.fetchLauncherContents()
                    .then((launcherEl: HTMLElement) => {
                        const oldLauncherContent = this.launcherPanel.querySelector(
                            '.scrollable-content',
                        );

                        const newLauncherContent = launcherEl.querySelector(
                            '.scrollable-content',
                        );
                        const parent = oldLauncherContent.parentNode;
                        parent.replaceChild(newLauncherContent, oldLauncherContent);
                        this.highlightActiveApp();
                        this.addAppItemsListeners();
                        this.setFocusableElements();
                    })
            ,
            1000,
            false,
        )();
    };

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
    };

    private listenToMouseMove = (): void => window.addEventListener('mousemove', this.disableKeyboardNavigation, true);

    private disableKeyboardNavigation = (): void => {
        this.getLauncherMainContainer().classList.remove('keyboard-navigation');
        this.unselectCurrentApp();
        window.removeEventListener('mousemove', this.disableKeyboardNavigation, true);
    };

    private initKeyboardNavigation = (): void => {
        const appContainer = this.getLauncherMainContainer();
        if (!appContainer.classList.contains('keyboard-navigation')) {
            this.listenToMouseMove();
            appContainer.classList.add('keyboard-navigation');
        }
    };

    private getApps(): Array<HTMLElement> {
        return Array.from(this.getLauncherMainContainer().querySelectorAll('.app-row'));
    }

    private getSelectedApp = (): HTMLElement => this.launcherPanel.querySelector('.app-row.selected');

    private getSelectedAppIndex = (): number => {
        const apps = this.getApps();
        for (let i = 0; i < apps.length; i++) {
            if (apps[i].classList.contains('selected')) {
                return i;
            }
        }
        return -1;
    };

    private selectNextApp = (): void => {
        const firstAppIndex = 0;
        const selectedIndex = this.getSelectedAppIndex();
        const apps = this.getApps();

        this.selectApp(
            selectedIndex + 1 === apps.length || selectedIndex === -1
            ? firstAppIndex
            : selectedIndex + 1,
        );
    };

    private selectPreviousApp = (): void => {
        const selectedIndex = this.getSelectedAppIndex();
        let nextIndex;
        if (selectedIndex === -1) {
            nextIndex = 0;
        } else if (selectedIndex === 0) {
            nextIndex = document.querySelectorAll('.app-row').length - 1;
        } else {
            nextIndex = selectedIndex - 1;
        }

        this.selectApp(nextIndex);
    };

    private selectApp = (index: number): void => {
        this.unselectCurrentApp();
        const app = this.getAppByIndex(index);
        setTimeout(() => {
            (<HTMLElement> app.parentNode).focus();
            app.classList.add('selected');
        }, 1);
    };

    private getAppByIndex = (index: number): Element => {
        const apps = this.getApps();
        for (let i = 0; i < apps.length; i++) {
            if (i === index) {
                return apps[i];
            }
        }
        return null;
    };

    private startApp = (app: HTMLElement): void => {
        const anchorEl = app.parentElement;
        if (anchorEl && anchorEl.tagName === 'A' && anchorEl.click) {
            this.unselectCurrentApp();
            anchorEl.click();
        }
    };

    private getLauncherMainContainer = (): HTMLElement => this.launcherMainContainer || document.querySelector('.launcher-main-container');
}

const getConfigAttribute = (attribute: string): string => {
    return currentScript?.getAttribute(`data-config-${attribute}`);
};

const getConfig = (): JSONObject => {
    return {
        theme: getConfigAttribute('theme'),
        autoOpenLauncher: getConfigAttribute('auto-open'),
        container: getConfigAttribute('container'),
        customCls: getConfigAttribute('custom-class'),
    };
};

const init = async (): Promise<void> => {
    const config: JSONObject = getConfig();

    i18nStore = await i18nFetch(i18nServiceUrl);
    new Launcher(config);
};

window.addEventListener('load', () => void init());
