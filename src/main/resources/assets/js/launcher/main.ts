import {KeyBinding} from '@enonic/lib-admin-ui/ui/KeyBinding';
import {KeyBindings} from '@enonic/lib-admin-ui/ui/KeyBindings';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {ThemeManager} from './ThemeManager';
import {i18nFetch} from '@enonic/lib-admin-ui/util/MessagesInitializer';

const toolKey = 'tool';
const homeAppToolKey = 'com.enonic.xp.app.main';
const pathName = window.location.pathname;
const toolBasePath = pathName.slice(0, pathName.indexOf(`/${toolKey}`)) + `/${toolKey}`;
const launcherUrl = `${toolBasePath}/${homeAppToolKey}/launcher`;
const i18nServiceUrl = `${toolBasePath}/_/service/${homeAppToolKey}/i18n`;
const isHomeApp: boolean = document.location.href.endsWith(toolBasePath) || document.location.href.endsWith(`${toolBasePath}/`);

const currentScript = document.currentScript;

type JSONObject = Record<string, string>;

let i18nStore: Map<string, string>;

const i18n = (key: string): string => i18nStore.has(key) ? i18nStore.get(key) : `#${key}#`;

class Launcher {
    private launcherPanel: HTMLElement;
    private launcherButton: HTMLElement;
    private launcherMainContainer: HTMLElement;
    private focusableElements: HTMLElement[];

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
        }, 200);
    }

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
        button.setAttribute('style', 'display: none;');

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

    private executeOnDOMInit = (): void => {
        const handler = () => {
            if (this.config['autoOpenLauncher'] === 'true') {
                this.openLauncherPanel();
            }
        };

        const observer = new MutationObserver((mutations_list) => {
            mutations_list.forEach((mutation) => {
                mutation.addedNodes.forEach((added_node) => {
                    if (added_node == this.launcherPanel) {
                        setTimeout(() => handler(), 500);
                        observer.disconnect();
                    }
                });
            });
        });
        observer.observe(document.body, {subtree: false, childList: true});
    };

    private appendLauncherPanel = (): void => {
        this.launcherPanel = document.createElement('div');
        this.launcherPanel.setAttribute('class', `launcher-panel ${this.getThemeClass()}`);
        this.launcherPanel.setAttribute('tabindex', '0');
        this.launcherPanel.setAttribute('style', 'display: none;');

        void this.fetchLauncherContents()
            .then((launcherEl: HTMLElement) => {
                this.launcherPanel.appendChild(launcherEl);
                this.launcherMainContainer = this.launcherPanel.firstChild as HTMLElement;
                if (isHomeApp) {
                    this.launcherMainContainer.classList.add('home');
                }

                this.executeOnDOMInit();

                document.body.appendChild(this.launcherPanel);
                Launcher.addLongClickHandler(this.launcherPanel);

                if (this.config['autoOpenLauncher'] !== 'true') {
                    const appTiles = this.launcherPanel
                        .querySelector('.launcher-app-container')
                        .querySelectorAll('a');
                    for (const appTile of Array.from(appTiles)) {
                        appTile.addEventListener('click', () => this.closeLauncherPanel(true));
                    }
                }
                this.highlightActiveApp();
                this.addAppItemsListeners();
                this.setFocusableElements();
            });
    };

    private onLauncherClick = (e: MouseEvent): void => {
        if (!this.launcherPanel || !this.launcherMainContainer) {
            return;
        }
        const isClickOutside =
            !this.launcherPanel.contains(e.target as Node) && !this.launcherButton.contains(e.target as Node);
        if (
            isClickOutside &&
            !this.launcherMainContainer.getAttribute('hidden') &&
            !Launcher.isModalDialogActiveOnHomePage(e.target as Element) &&
            !Launcher.isDashboardIcon(e.target as Element)
        ) {
            this.closeLauncherPanel();
        }
    };

    private static elementExists = (element: Element) => typeof(element) != 'undefined' && element != null;

    private static isDashboardIcon = (element: Element) =>
        Launcher.elementExists(element.closest('.dashboard-item')) &&
        element.parentElement.getAttribute('href') !== '#';

    private static isModalDialogActiveOnHomePage = (element: Element): boolean => {
        return (
            isHomeApp &&
            (
                document.body.classList.contains('modal-dialog')
                || Launcher.elementExists(element.closest('.xp-admin-common-modal-dialog'))
            )
        );
    };

    private static openWindow = (windowArr: Window[], anchorEl: HTMLAnchorElement) => {
        const windowId: string = anchorEl.getAttribute('data-id');
        const existingWindow: Window = (windowArr[windowId] as Window);

        if (existingWindow && !existingWindow.closed) {
            try {
                if (existingWindow.location.href.startsWith(anchorEl.href)) {
                    existingWindow.focus();
                    return;
                }
            }
            catch (e) {
                // Url in the opened tab has changed, and we no longer control it. Close, then reload.
                existingWindow.close();
            }
        }

        // eslint-disable-next-line no-param-reassign
        windowArr[windowId] = window.open(anchorEl.href, windowId);
    };

    private static addLongClickHandler = (container: HTMLElement): void => {
        let longpress = false;
        let startTime;
        let endTime;
        const toolWindows: Window[] = [];

        const appTiles = container
            .querySelector('.launcher-app-container')
            .querySelectorAll('a');
        for (const appTile of Array.from(appTiles)) {
            // eslint-disable-next-line no-loop-func
            appTile.addEventListener('click', e => {
                if (isHomeApp && (e.currentTarget as Element).getAttribute('data-id') === 'home') {
                    e.preventDefault();
                    return;
                }

                if (longpress) {
                    e.preventDefault();
                                       document.location.href = (e.currentTarget as Element).getAttribute('href');
                } else {
                    e.preventDefault();
                    Launcher.openWindow(toolWindows, e.currentTarget as HTMLAnchorElement);
                }
            });
            // eslint-disable-next-line no-loop-func
            appTile.addEventListener('mousedown', () => {
                startTime = new Date().getTime();
            });
            // eslint-disable-next-line no-loop-func
            appTile.addEventListener('mouseup', () => {
                endTime = new Date().getTime();
                longpress = endTime - startTime >= 500;
            });
        }
    };

    private openLauncherPanel = (): void => {
        this.listenToKeyboardEvents();
        this.toggleButton();
        this.launcherPanel.classList.add('visible');
        this.launcherButton.setAttribute('title', i18n('launcher.tooltip.closeMenu'));
        this.launcherButton.focus();
        document.addEventListener('click', this.onLauncherClick);
    };

    private closeLauncherPanel = (skipTransition?: boolean): void => {
        document.removeEventListener('click', this.onLauncherClick);
        this.unlistenToKeyboardEvents();
        this.launcherPanel.classList.remove('visible');
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
        for (const appRow of Array.from(appRows)) {
            if ((appRow.id === 'home' && isHomeApp) ||
                document.location.href.includes(`/${appRow.id}/`)) {
                appRow.classList.add('active');
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
                const eventType: ApplicationEventType = e.getEventType();
                const statusChanged: boolean =
                    ApplicationEventType.STARTED === eventType ||
                    ApplicationEventType.STOPPED === eventType ||
                    ApplicationEventType.UNINSTALLED === eventType;

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

    private getApps(): HTMLElement[] {
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
            app.parentElement.focus();
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
        theme: getConfigAttribute('theme') || 'light',
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
