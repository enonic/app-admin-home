import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {KeyBinding} from '@enonic/lib-admin-ui/ui/KeyBinding';
import {KeyBindings} from '@enonic/lib-admin-ui/ui/KeyBindings';


type JSONObject = Record<string, string>;

const INITIALIZED_ATTR = 'data-menu-initialized';

interface MenuConfig {
    appName: string;
    autoOpen: boolean;
    menuUrl: string;
    backgroundUrl: string;
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
            if (!this.isPanelExpanded() || !this.isAppOnFocus()) {
                return true;
            }

            const selectedIndex = this.getSelectedAppIndex();
            const isLastApp = selectedIndex >= this.getApps().length - 1;

            if (isLastApp) {
                this.unselectCurrentApp();
                e.preventDefault();
                this.avatarButton.focus();
                return false;
            }

            this.initKeyboardNavigation();
            this.selectNextApp();
            return true;
        });

    private shiftTabPrevApp: KeyBinding = new KeyBinding('shift+tab')
        .setGlobal(true)
        .setCallback((e: Event) => {
            if (!this.isPanelExpanded() || !this.isAppOnFocus()) {
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

        this.initAvatarButton();
        this.initMenuButton();
        this.initMenuPanel();
        this.addApplicationsListeners();

        if (this.config.autoOpen) {
            this.openMenuPanel();
            this.menuButton.focus();
        }
    }

    private addAppItemsListeners = (): void => {
        this.getApps().forEach((app: HTMLElement, index: number) => {
            app.addEventListener('mouseenter', () => {
                this.selectApp(index);
            });
        });

        const dashboardIcon = this.menuPanel.querySelector('.icon-dashboard');
        const dashboardLink = dashboardIcon?.closest('a.app-tile');
        if (!(dashboardLink instanceof HTMLAnchorElement)) {
            return;
        }

        dashboardLink.addEventListener('click', (e: Event) => {
            if (e instanceof MouseEvent) {
                const modifiedClick = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
                if (modifiedClick) {
                    return;
                }
            }

            e.preventDefault();
            this.closeMenuPanel();

            if (dashboardLink.classList.contains('home-app')) {
                return;
            }

            // Keep direct home loads opening the menu; only disable it when coming from embedded Dashboard navigation.
            const dashboardUrl = new URL(dashboardLink.href, window.location.href);
            dashboardUrl.searchParams.set('openMenu', 'false');
            window.top?.location.assign(dashboardUrl.toString());
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

    private fetchMenuContents = (): Promise<Document> => {
        return fetch(this.config.menuUrl)
            .then(response => response.text())
            .then((html: string) => new DOMParser().parseFromString(html, 'text/html'))
            .catch((e: Error) => {
                throw new Error(`Failed to fetch page: ${e.toString()}`);
            });
    };

    private initMenuPanel = (): void => {
        this.menuPanel = this.root.getElementById('menu-panel');
        this.menuMainContainer = this.root.getElementById('menu-main-container');

        this.initBackgroundImage();

        this.initInfoPanelLinks();
        this.addAppItemsListeners();
        this.setFocusableElements();
    }

    private initInfoPanelLinks = (): void => {
        const links = this.menuPanel.querySelectorAll('.menu-info-link-row');
        links.forEach((link: HTMLElement) => {
            link.setAttribute('tabindex', '-1');
        });
    };

    private initBackgroundImage = (): void => {
        const bg = this.menuPanel.querySelector('.menu-background');
        if (!bg || !this.config.backgroundUrl) {
            return;
        }
        (bg as HTMLElement).style.backgroundImage = `url('${this.config.backgroundUrl}')`;
        const img = new Image();
        img.onload = () => {
            bg.classList.add('loaded');
            bg.addEventListener('transitionend', () => {
                document.dispatchEvent(new CustomEvent('menu-background-ready'));
            }, {once: true});
        };
        img.src = this.config.backgroundUrl;
    };

    private avatarButton: HTMLElement;
    private avatarDropdown: HTMLElement;
    private avatarContainer: HTMLElement;

    private initAvatarButton = (): void => {
        this.avatarButton = this.root.getElementById('avatar-button');
        this.avatarDropdown = this.root.getElementById('avatar-dropdown');
        const container = this.avatarButton?.parentElement;

        if (!this.avatarButton || !this.avatarDropdown || !container) {
            return;
        }

        this.avatarContainer = container;

        this.avatarButton.addEventListener('click', (e: Event) => {
            e.stopPropagation();
            this.toggleAvatarDropdown();
        });

        document.addEventListener('click', (e: Event) => {
            if (!container.contains(e.target as Node)) {
                this.closeAvatarDropdown();
            }
        });

        this.avatarButton.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.toggleAvatarDropdown();
            } else if (e.key === 'Escape') {
                this.closeAvatarDropdown();
                this.avatarButton.focus();
            } else if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                this.menuButton.focus();
            } else if (e.key === 'Tab' && e.shiftKey) {
                e.preventDefault();
                const apps = this.getApps();
                if (apps.length > 0) {
                    this.selectApp(apps.length - 1);
                } else {
                    this.menuButton.focus();
                }
            }
        });
    };

    private toggleAvatarDropdown = (): void => {
        const expanded = this.avatarDropdown.classList.toggle('expanded');
        this.avatarButton.setAttribute('aria-expanded', String(expanded));
    };

    private isAvatarDropdownExpanded = (): boolean => this.avatarDropdown?.classList.contains('expanded') ?? false;

    private closeAvatarDropdown = (): void => {
        this.avatarDropdown.classList.remove('expanded');
        this.avatarButton.setAttribute('aria-expanded', 'false');
    };

    private initMenuButton = (): void => {
        const button = this.root.getElementById('menu-button');

        button.addEventListener('click', this.togglePanelState);
        button.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key !== 'Tab' || !this.isPanelExpanded()) {
                return;
            }
            if (!e.shiftKey) {
                e.preventDefault();
                this.selectApp(0);
            } else {
                e.preventDefault();
                this.avatarButton.focus();
            }
        });

        button.classList.add('visible');

        this.menuButton = button;
    };

    private openMenuPanel = (): void => {
        this.avatarContainer?.classList.add('visible');
        this.listenToKeyboardEvents();
        this.toggleButton();
        this.menuPanel.classList.add('visible');
        this.menuButton.setAttribute('title', this.config.phrases['tooltipCloseMenu']);
        this.menuButton.setAttribute('aria-label', this.config.phrases['tooltipCloseMenu']);
        this.menuButton.setAttribute('aria-expanded', 'true');
    };

    private closeMenuPanel = (): void => {
        this.closeAvatarDropdown();
        this.avatarContainer?.classList.remove('visible');
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

    private reloadTimer: ReturnType<typeof setTimeout> | null = null;

    private reloadMenu = (): void => {
        if (this.reloadTimer) {
            clearTimeout(this.reloadTimer);
        }
        this.reloadTimer = setTimeout(() => {
            this.reloadTimer = null;
            this.fetchMenuContents()
                .then((doc: Document) => {
                    const oldGrid = this.menuPanel.querySelector('.app-grid');
                    const newGrid = doc.querySelector('.app-grid');
                    if (oldGrid && newGrid) {
                        oldGrid.parentNode.replaceChild(
                            document.importNode(newGrid, true),
                            oldGrid,
                        );
                        this.addAppItemsListeners();
                        this.setFocusableElements();
                    }
                });
        }, 1000);
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
        return Array.from(this.getMenuMainContainer().querySelectorAll('.app-tile'));
    }

    private getSelectedApp = (): HTMLElement => this.menuPanel.querySelector('.app-tile.selected');

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
            nextIndex = this.root.querySelectorAll('.app-tile').length - 1;
        } else {
            nextIndex = selectedIndex - 1;
        }

        this.selectApp(nextIndex);
    };

    private selectApp = (index: number): void => {
        this.unselectCurrentApp();
        const app = this.getAppByIndex(index);
        setTimeout(() => {
            (app as HTMLElement).focus();
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
        if (app.tagName === 'A' && app.click) {
            this.unselectCurrentApp();
            app.click();
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
