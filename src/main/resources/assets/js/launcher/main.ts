import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {Element as LibAdminElement} from '@enonic/lib-admin-ui/dom/Element';
import {KeyBinding} from '@enonic/lib-admin-ui/ui/KeyBinding';
import {KeyBindings} from '@enonic/lib-admin-ui/ui/KeyBindings';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {WidgetHelper} from '@enonic/lib-admin-ui/widget/WidgetHelper';
import {ThemeManager} from './ThemeManager';

type JSONObject = Record<string, string>;

interface LauncherConfig {
    appName: string;
    autoOpen: boolean;
    launcherUrl: string;
    phrases: JSONObject;
    customCls?: string;
    theme?: string;
}

const getLauncherJsonConfig = (): LauncherConfig => {
    const scriptTagElement: HTMLElement = document.getElementById('launcher-config-json');
    if (!scriptTagElement || scriptTagElement.tagName.toLowerCase() !== 'script') {
        throw Error('Could not find launcher config');
    }
    return JSON.parse(scriptTagElement.innerText) as LauncherConfig;
};

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

    readonly config: LauncherConfig;

    constructor(config: LauncherConfig) {
        this.config = config;

        this.initLauncherButton();
        this.initLauncherPanel();
        this.addApplicationsListeners();

        if (this.config.autoOpen) {
            this.openLauncherPanel();
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

    private getThemeClass = (): string => {
        if (this.config.customCls) {
            return `theme-custom ${this.config.customCls}`;
        }

        return `theme-${ThemeManager.getTheme(this.config.theme)}`;
    };

    private isHomeApp(): boolean {
        return this.config.appName === 'com.enonic.xp.app.main';
    }

    private isPanelExpanded = (): boolean => this.launcherPanel.classList.contains('visible');

    private togglePanelState = (): void => this.isPanelExpanded() ? this.closeLauncherPanel() : this.openLauncherPanel();

    private toggleButton = () => {
        this.launcherButton.classList.toggle('toggled');
        this.launcherButton.focus();
    };

    private launcherButtonHasFocus = (): boolean => document.activeElement === this.launcherButton;

    private fetchLauncherContents = (): Promise<LibAdminElement> => {
        return fetch(this.config.launcherUrl)
            .then(response => response.text())
            .then((html: string) => WidgetHelper.createFromHtml(html))
            .catch((e: Error) => {
                throw new Error(`Failed to fetch page: ${e.toString()}`);
            });
    };

    private initLauncherPanel = (): void => {
        this.launcherPanel = document.getElementById('launcher-panel');
        this.launcherMainContainer = document.getElementById('launcher-main-container');

        this.launcherPanel.classList.add(`${this.getThemeClass()}`.trim());
        Launcher.addLongClickHandler(this.launcherPanel, this.isHomeApp());

        if (!this.config.autoOpen) {
            const appTiles = this.launcherPanel
                .querySelector('.launcher-app-container')
                .querySelectorAll('a');
            for (const appTile of Array.from(appTiles)) {
                appTile.addEventListener('click', () => this.closeLauncherPanel());
            }
        }

        this.addAppItemsListeners();
        this.setFocusableElements();
    }

    private initLauncherButton = (): void => {
        const button = document.getElementById('launcher-button');

        button.addEventListener('click', this.togglePanelState);
        button.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                this.selectApp(0);
                return false;
            }
        });

        button.classList.add('visible', `${this.getThemeClass()}`);

        this.launcherButton = button;
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
            !Launcher.isModalDialogActiveOnHomePage(e.target, this.isHomeApp()) &&
            !Launcher.isDashboardIcon(e.target)
        ) {
            this.closeLauncherPanel();
        }
    };

    private static toElement(target: EventTarget | null): Element | null {
        if (!target) return null;
        if (target instanceof Element) return target;
        if (target instanceof Node) return target.parentElement;
        return null;
    }

    private static isDashboardIcon(target: EventTarget): boolean {
        const el = Launcher.toElement(target);
        if (!el) return false;

        const inDashboard = el.closest('.dashboard-item') !== null;
        const parentHref = el.parentElement?.getAttribute('href');
        return inDashboard && parentHref !== '#';
    }

    private static isModalDialogActiveOnHomePage(target: EventTarget, isHomeApp: boolean): boolean {
        if (!isHomeApp) return false;

        const el = Launcher.toElement(target);
        const bodyHasModal = document.body.classList.contains('modal-dialog');
        const insideXpModal = el?.closest('.xp-admin-common-modal-dialog') !== null;

        return bodyHasModal || insideXpModal;
    }

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
            .querySelector('.launcher-app-container')
            .querySelectorAll('a');
        for (const appTile of Array.from(appTiles)) {

            appTile.addEventListener('click', e => {
                e.preventDefault();
                if (longpress) {
                    document.location.href = (e.currentTarget as Element).getAttribute('href');
                } else {
                    Launcher.openWindow(toolWindows, e.currentTarget as HTMLAnchorElement);
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

    private openLauncherPanel = (): void => {
        this.listenToKeyboardEvents();
        this.toggleButton();
        this.launcherPanel.classList.add('visible');
        this.launcherButton.setAttribute('title', this.config.phrases['tooltipCloseMenu']);
        document.addEventListener('click', this.onLauncherClick);
    };

    private closeLauncherPanel = (): void => {
        document.removeEventListener('click', this.onLauncherClick);
        this.unlistenToKeyboardEvents();
        this.launcherPanel.classList.remove('visible');
        this.toggleButton();
        this.launcherButton.setAttribute('title', this.config.phrases['tooltipOpenMenu']);
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
                    .then((launcherEl: LibAdminElement) => {
                        const oldLauncherContent = this.launcherPanel.querySelector(
                            '.scrollable-content',
                        );

                        const newLauncherContent = launcherEl.getHTMLElement().querySelector(
                            '.scrollable-content',
                        );
                        const parent = oldLauncherContent.parentNode;
                        parent.replaceChild(newLauncherContent, oldLauncherContent);
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

    private getLauncherMainContainer = (): HTMLElement => this.launcherMainContainer || document.querySelector('.launcher-main-container');
}

const init = (): void => {
    const launcherConfig: LauncherConfig = getLauncherJsonConfig();
    new Launcher(launcherConfig);
};

init();
