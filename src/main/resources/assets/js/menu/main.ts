import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {Element as LibAdminElement} from '@enonic/lib-admin-ui/dom/Element';
import {KeyBinding} from '@enonic/lib-admin-ui/ui/KeyBinding';
import {KeyBindings} from '@enonic/lib-admin-ui/ui/KeyBindings';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ExtensionHelper} from '@enonic/lib-admin-ui/extension/ExtensionHelper';

type JSONObject = Record<string, string>;

const INITIALIZED_ATTR = 'data-menu-initialized';

interface MenuConfig {
    appName: string;
    autoOpen: boolean;
    menuUrl: string;
    phrases: JSONObject;
}

export const getMenuJsonConfig = (root: {getElementById(id: string): HTMLElement | null}): MenuConfig => {
    const scriptTagElement: HTMLElement = root.getElementById('menu-config-json');
    if (!scriptTagElement || scriptTagElement.tagName.toLowerCase() !== 'script') {
        throw Error('Could not find menu config');
    }
    return JSON.parse(scriptTagElement.innerText) as MenuConfig;
};

export class Menu {
    private readonly root: ShadowRoot | Document;
    private menuPanel: HTMLElement;
    private menuButton: HTMLElement;
    private menuMainContainer: HTMLElement;
    private focusableElements: HTMLElement[];

    private closeMenu: KeyBinding = new KeyBinding('esc')
        .setGlobal(true)
        .setCallback(e => {
            if (!this.isPanelExpanded()) {
                return;
            }
            e.preventDefault();
            e.returnValue = false;

            this.closeMenuPanel();

            return false;
        });

    private nextApp: KeyBinding = new KeyBinding('down')
        .setGlobal(true)
        .setCallback((e: Event) => {
            if (!this.isPanelExpanded()) {
                return false;
            }
            this.initKeyboardNavigation();
            this.selectNextApp();
            return false;
        });

    private prevApp: KeyBinding = new KeyBinding('up')
        .setGlobal(true)
        .setCallback((e: Event) => {
            if (!this.isPanelExpanded()) {
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
                || !this.menuPanel.contains(this.getNextFocusableElement())) {
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
            if (!this.isPanelExpanded() || !this.menuPanel.contains(document.activeElement)) {
                this.unselectCurrentApp();
                return true;
            }

            if (!this.isAppOnFocus()) {
                this.selectApp(this.getApps().length - 1);
                return true;
            }

            const desiredIndexIsLessThanMinIndex = this.getSelectedAppIndex() - 1 < 0;

            if (desiredIndexIsLessThanMinIndex) {
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
                } else if (this.menuButtonHasFocus()) {
                    this.closeMenuPanel();
                }
            }
            return false;
        });

    private menuBindings: KeyBinding[] = [
        this.closeMenu,
        this.prevApp,
        this.nextApp,
        this.tabNextApp,
        this.shiftTabPrevApp,
        this.runApp,
    ];

    readonly config: MenuConfig;

    constructor(config: MenuConfig, root?: ShadowRoot) {
        this.config = config;
        this.root = root || document;

        const configEl = this.root.getElementById('menu-config-json');
        if (configEl) {
            configEl.setAttribute(INITIALIZED_ATTR, '');
        }

        this.initMenuButton();
        this.initMenuPanel();
        this.addApplicationsListeners();

        if (this.config.autoOpen) {
            this.openMenuPanel();
        }
    }

    private addAppItemsListeners = (): void => {
        this.getApps().forEach((app: HTMLElement, index:number) => {
            app.addEventListener('mouseenter', () => {
                this.selectApp(index);
            });

            if (index === 0){
                app.parentNode.addEventListener('keydown', (e: KeyboardEvent) => {
                    if (e.key === 'Tab' && e.shiftKey){
                        setTimeout(() => this.menuButton.focus(), 100);
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
                if (el.disabled || (el.getAttribute('tabindex') && parseInt(el.getAttribute('tabindex')) < 0)) {
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

    private isHomeApp(): boolean {
        return this.config.appName === 'com.enonic.xp.app.main';
    }

    private isPanelExpanded = (): boolean => this.menuPanel.classList.contains('visible');

    private togglePanelState = (): void => this.isPanelExpanded() ? this.closeMenuPanel() : this.openMenuPanel();

    private toggleButton = () => {
        this.menuButton.classList.toggle('toggled');
        this.menuButton.focus();
    };

    private menuButtonHasFocus = (): boolean => {
        if (this.root instanceof ShadowRoot) {
            return this.root.activeElement === this.menuButton;
        }
        return document.activeElement === this.menuButton;
    };

    private fetchMenuContents = (): Promise<LibAdminElement> => {
        return fetch(this.config.menuUrl)
            .then(response => response.text())
            .then((html: string) => ExtensionHelper.createFromHtml(html))
            .catch((e: Error) => {
                throw new Error(`Failed to fetch page: ${e.toString()}`);
            });
    };

    private initMenuPanel = (): void => {
        this.menuPanel = this.root.getElementById('menu-panel');
        this.menuMainContainer = this.root.getElementById('menu-main-container');

        Menu.addLongClickHandler(this.menuPanel, this.isHomeApp());

        if (!this.config.autoOpen) {
            const appTiles = this.menuPanel
                .querySelector('.menu-app-container')
                .querySelectorAll('a');
            for (const appTile of Array.from(appTiles)) {
                appTile.addEventListener('click', () => this.closeMenuPanel());
            }
        }

        this.addAppItemsListeners();
        this.setFocusableElements();
    }

    private initMenuButton = (): void => {
        const button = this.root.getElementById('menu-button');

        button.addEventListener('click', this.togglePanelState);
        button.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                this.selectApp(0);
                return false;
            }
        });

        button.classList.add('visible');

        this.menuButton = button;
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


        windowArr[windowId] = window.open(anchorEl.href, windowId);
    };

    private static addLongClickHandler = (container: HTMLElement, isHomeApp: boolean): void => {
        let longpress = false;
        let startTime;
        let endTime;
        const toolWindows: Window[] = [];

        const appTiles = container
            .querySelector('.menu-app-container')
            .querySelectorAll('a');
        for (const appTile of Array.from(appTiles)) {

            appTile.addEventListener('click', e => {
                e.preventDefault();
                if (longpress) {
                    document.location.href = (e.currentTarget as Element).getAttribute('href');
                } else {
                    Menu.openWindow(toolWindows, e.currentTarget as HTMLAnchorElement);
                }
            });

            appTile.addEventListener('mousedown', () => {
                startTime = new Date().getTime();
            });

            appTile.addEventListener('mouseup', () => {
                endTime = new Date().getTime();
                longpress = endTime - startTime >= 500;
            });
        }
    };

    private openMenuPanel = (): void => {
        this.listenToKeyboardEvents();
        this.toggleButton();
        this.menuPanel.classList.add('visible');
        this.menuButton.setAttribute('title', this.config.phrases['tooltipCloseMenu']);
        this.menuButton.setAttribute('aria-label', this.config.phrases['tooltipCloseMenu']);
        this.menuButton.setAttribute('aria-expanded', 'true');
    };

    private closeMenuPanel = (): void => {
        this.unlistenToKeyboardEvents();
        this.menuPanel.classList.remove('visible');
        this.toggleButton();
        this.menuButton.setAttribute('title', this.config.phrases['tooltipOpenMenu']);
        this.menuButton.setAttribute('aria-label', this.config.phrases['tooltipOpenMenu']);
        this.menuButton.setAttribute('aria-expanded', 'false');
        this.unselectCurrentApp();
    };

    private listenToKeyboardEvents = (): void => KeyBindings.get().bindKeys(this.menuBindings);

    private unlistenToKeyboardEvents = (): void => KeyBindings.get().unbindKeys(this.menuBindings);

    private unselectCurrentApp = (): void => {
        const selectedApp = this.getSelectedApp();
        if (selectedApp) {
            selectedApp.classList.remove('selected');
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

    private reloadMenu = (): void => {
        return AppHelper.debounce(
            () =>
                this.fetchMenuContents()
                    .then((menuEl: LibAdminElement) => {
                        const oldMenuContent = this.menuPanel.querySelector(
                            '.scrollable-content',
                        );

                        const newMenuContent = menuEl.getHTMLElement().querySelector(
                            '.scrollable-content',
                        );
                        const parent = oldMenuContent.parentNode;
                        parent.replaceChild(newMenuContent, oldMenuContent);
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
                    this.reloadMenu();
                }
            });
            return true;
        }
        return false;
    };

    private listenToMouseMove = (): void => window.addEventListener('mousemove', this.disableKeyboardNavigation, true);

    private disableKeyboardNavigation = (): void => {
        this.getMenuMainContainer().classList.remove('keyboard-navigation');
        this.unselectCurrentApp();
        window.removeEventListener('mousemove', this.disableKeyboardNavigation, true);
    };

    private initKeyboardNavigation = (): void => {
        const appContainer = this.getMenuMainContainer();
        if (!appContainer.classList.contains('keyboard-navigation')) {
            this.listenToMouseMove();
            appContainer.classList.add('keyboard-navigation');
        }
    };

    private getApps(): HTMLElement[] {
        return Array.from(this.getMenuMainContainer().querySelectorAll('.app-row'));
    }

    private getSelectedApp = (): HTMLElement => this.menuPanel.querySelector('.app-row.selected');

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
            nextIndex = this.root.querySelectorAll('.app-row').length - 1;
        } else {
            nextIndex = selectedIndex - 1;
        }

        this.selectApp(nextIndex);
    };

    private selectApp = (index: number): void => {
        this.unselectCurrentApp();
        const app = this.getAppByIndex(index);
        setTimeout(() => {
            (app.parentNode as HTMLElement).focus();
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

    private getMenuMainContainer = (): HTMLElement => this.menuMainContainer || this.root.querySelector('.menu-main-container');
}

(() => {
    const configEl = document.getElementById('menu-config-json');
    if (!configEl || configEl.hasAttribute(INITIALIZED_ATTR)) {
        return;
    }
    const rootNode = configEl.getRootNode();
    const shadowRoot = rootNode instanceof ShadowRoot ? rootNode : undefined;
    const config = JSON.parse(configEl.innerText) as MenuConfig;
    new Menu(config, shadowRoot);
})();
