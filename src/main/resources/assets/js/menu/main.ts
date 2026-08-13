import {KeyBinding} from '@enonic/lib-admin-ui/ui/KeyBinding';
import {KeyBindings} from '@enonic/lib-admin-ui/ui/KeyBindings';
import {WorkerServerEventsConnection} from './server-events/WorkerServerEventsConnection';

const SERVER_EVENTS_FLAG = '__xpMenuServerEventsListenerStarted';


type JSONObject = Record<string, string>;

const INITIALIZED_ATTR = 'data-menu-initialized';

const TOOL_ID_ATTR = 'data-tool-id';

const ADMIN_TOOLS_CHANGED_EVENT = 'xp-admin-tools-changed';

const RELOAD_DEBOUNCE_MS = 250;

interface MenuConfig {
    autoOpen: boolean;
    isHomeApp?: boolean;
    menuUrl: string;
    backgroundUrl: string;
    sharedSocketUrl?: string;
    eventsUrl?: string;
    eventsTopic?: string;
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

    private getActiveElement = (): Element | null => {
        return this.root instanceof ShadowRoot ? this.root.activeElement : document.activeElement;
    };

    private nextTool: KeyBinding = new KeyBinding('down')
        .setGlobal(true)
        .setCallback((e: Event) => {
            if (!this.isPanelExpanded()) {
                return false;
            }

            if (this.isAvatarDropdownExpanded()) {
                const activeElement = this.getActiveElement();
                const focusIsInDropdown = this.avatarDropdown.contains(activeElement);

                if (!focusIsInDropdown) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    this.focusFirstAvatarMenuItem();
                }

                return false;
            }

            this.initKeyboardNavigation();
            this.selectNextTool();
            return false;
        });

    private prevTool: KeyBinding = new KeyBinding('up')
        .setGlobal(true)
        .setCallback((e: Event) => {
            if (!this.isPanelExpanded() || this.isAvatarDropdownExpanded()) {
                return false;
            }
            this.initKeyboardNavigation();
            this.selectPreviousTool();
            return false;
        });


    private tabNextTool: KeyBinding = new KeyBinding('tab')
        .setGlobal(true)
        .setCallback((e: Event) => {
            if (!this.isPanelExpanded() || !this.isToolFocused()) {
                return true;
            }

            const selectedIndex = this.getSelectedToolIndex();
            const isLastTool = selectedIndex >= this.getTools().length - 1;

            if (isLastTool) {
                this.unselectCurrentTool();
                e.preventDefault();
                this.avatarButton.focus();
                return false;
            }

            this.initKeyboardNavigation();
            this.selectNextTool();
            return true;
        });

    private shiftTabPrevTool: KeyBinding = new KeyBinding('shift+tab')
        .setGlobal(true)
        .setCallback((e: Event) => {
            if (!this.isPanelExpanded() || !this.isToolFocused()) {
                return true;
            }

            const desiredIndexIsLessThanMinIndex = this.getSelectedToolIndex() - 1 < 0;

            if (desiredIndexIsLessThanMinIndex) {
                e.preventDefault();
                this.unselectCurrentTool();
                const target = this.menuButton.hidden ? this.avatarButton : this.menuButton;
                setTimeout(() => target.focus(), 0);
                return false;
            }

            this.initKeyboardNavigation();
            this.selectPreviousTool();
            return true;
        });

    private runTool: KeyBinding = new KeyBinding('enter')
        .setGlobal(true)
        .setCallback(e => {
            if (this.isPanelExpanded()) {
                const selectedTool = this.getSelectedTool() || this.getFocusedTool();
                if (selectedTool) {
                    e.preventDefault();
                    e.returnValue = false;
                    this.openTool(selectedTool);
                } else if (this.menuButtonHasFocus()) {
                    e.preventDefault();
                    e.returnValue = false;
                    this.closeMenuPanel();
                }
            }
            return false;
        });

    private getFocusedTool = (): HTMLElement | null => {
        const active = this.getActiveElement();
        if (active instanceof HTMLElement && active.classList.contains('app-tile')) {
            return active;
        }
        return null;
    };

    private menuBindings: KeyBinding[] = [
        this.prevTool,
        this.nextTool,
        this.tabNextTool,
        this.shiftTabPrevTool,
        this.runTool,
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
        this.initServerEventsListener();
        document.addEventListener(ADMIN_TOOLS_CHANGED_EVENT, this.scheduleMenuReload);

        if (this.config.autoOpen) {
            this.openMenuPanel();
        }
    }

    private isToolFocused(): boolean {
        const tools = this.getTools();
        return tools.some((tool: HTMLElement) => tool.classList.contains('selected'));
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
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Unexpected status ${response.status}`);
                }
                return response.text();
            })
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
        this.setFocusableElements();

        this.menuPanel.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key !== 'Tab' || !e.shiftKey || !this.isPanelExpanded()) {
                return;
            }
            const tools = this.getTools();
            if (tools.length === 0 || this.getActiveElement() !== tools[0]) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            this.unselectCurrentTool();
            const target = this.menuButton.hidden ? this.avatarButton : this.menuButton;
            target.focus();
        });
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
        this.avatarButton.setAttribute('tabindex', '-1');

        this.avatarButton.addEventListener('click', (e: Event) => {
            e.stopPropagation();
            this.avatarButton.focus();
            this.toggleAvatarDropdown();
        });

        document.addEventListener('click', (e: Event) => {
            if (!container.contains(e.target as Node)) {
                this.closeAvatarDropdown();
            }
        });

        container.addEventListener('focusout', () => {
            requestAnimationFrame(() => {
                const rootActiveElement = this.root instanceof ShadowRoot ? this.root.activeElement : document.activeElement;
                const documentActiveElement = document.activeElement;
                const focusRemainsInsideContainer =
                    container.contains(rootActiveElement) || container.contains(documentActiveElement);

                if (this.isAvatarDropdownExpanded() && !focusRemainsInsideContainer) {
                    this.closeAvatarDropdown();
                }
            });
        });

        this.avatarDropdown.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this.closeAvatarDropdown();
                this.avatarButton.focus();
            } else if (e.key === 'Enter') {
                const active = this.getActiveElement();
                if (active instanceof HTMLElement && this.avatarDropdown.contains(active)) {
                    e.preventDefault();
                    e.stopPropagation();
                    active.click();
                }
            }
        });

        this.avatarButton.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.toggleAvatarDropdown();
            } else if (e.key === 'Escape') {
                this.closeAvatarDropdown();
                this.avatarButton.focus();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                if (!this.isAvatarDropdownExpanded()) {
                    this.toggleAvatarDropdown();
                }
                this.focusFirstAvatarMenuItem();
            } else if (e.key === 'Tab') {
                if (!e.shiftKey) {
                    e.preventDefault();
                    if (this.menuButton.hidden) {
                        this.selectTool(0);
                    } else {
                        this.menuButton.focus();
                    }
                } else {
                    e.preventDefault();
                    const tools = this.getTools();
                    if (tools.length > 0) {
                        this.selectTool(tools.length - 1);
                    } else {
                        this.menuButton.focus();
                    }
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

    private focusFirstAvatarMenuItem = (): void => {
        const firstItem = this.avatarDropdown.querySelector<HTMLElement>('.avatar-dropdown-item');
        firstItem?.focus();
    };

    private initMenuButton = (): void => {
        const button = this.root.getElementById('menu-button');
        this.menuButton = button;

        button.addEventListener('click', this.togglePanelState);
        button.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key !== 'Tab') {
                return;
            }
            if (e.shiftKey) {
                e.preventDefault();
                this.avatarButton.focus();
                return;
            }
            if (!this.isPanelExpanded()) {
                return;
            }
            e.preventDefault();
            this.selectTool(0);
        });

        button.classList.add('visible');
    };

    private hideMenuButton = (): void => {
        if (!this.config.autoOpen || !this.config.isHomeApp) {
            return;
        }
        this.menuButton.hidden = true;
        this.menuButton.setAttribute('tabindex', '-1');
    };

    private revealMenuButton = (): void => {
        this.menuButton.hidden = false;
        this.menuButton.removeAttribute('tabindex');
    };

    private openMenuPanel = (): void => {
        this.listenToKeyboardEvents();
        this.toggleButton();
        this.menuPanel.classList.add('visible');
        this.menuButton.classList.add('menu-open');
        this.avatarButton.classList.add('menu-open');
        this.menuButton.setAttribute('title', this.config.phrases['tooltipCloseMenu']);
        this.menuButton.setAttribute('aria-label', this.config.phrases['tooltipCloseMenu']);
        this.menuButton.setAttribute('aria-expanded', 'true');
        this.avatarButton.removeAttribute('tabindex');
        this.hideMenuButton();
    };

    private closeMenuPanel = (): void => {
        this.closeAvatarDropdown();
        this.unlistenToKeyboardEvents();
        this.menuPanel.classList.remove('visible');
        this.menuButton.classList.remove('menu-open');
        this.avatarButton.classList.remove('menu-open');
        this.revealMenuButton();
        this.toggleButton();
        this.menuButton.setAttribute('title', this.config.phrases['tooltipOpenMenu']);
        this.menuButton.setAttribute('aria-label', this.config.phrases['tooltipOpenMenu']);
        this.menuButton.setAttribute('aria-expanded', 'false');
        this.unselectCurrentTool();
        this.avatarButton.setAttribute('tabindex', '-1');
        document.dispatchEvent(new CustomEvent('menu-panel-closed'));
    };

    private listenToKeyboardEvents = (): void => KeyBindings.get().bindKeys(this.menuBindings);

    private unlistenToKeyboardEvents = (): void => KeyBindings.get().unbindKeys(this.menuBindings);

    private unselectCurrentTool = (): void => {
        const selectedTool = this.getSelectedTool();
        if (selectedTool) {
            selectedTool.classList.remove('selected');
        }
    };

    private initServerEventsListener = (): void => {
        const {sharedSocketUrl, eventsUrl, eventsTopic} = this.config;
        if (!sharedSocketUrl || !eventsUrl || !eventsTopic) {
            return;
        }
        const w = window as unknown as Record<string, boolean>;
        if (w[SERVER_EVENTS_FLAG]) {
            return;
        }
        w[SERVER_EVENTS_FLAG] = true;
        const connection = new WorkerServerEventsConnection(sharedSocketUrl, eventsUrl);
        connection.onReceived(notification => {
            if (notification.topic !== eventsTopic) {
                return;
            }
            // event or detected loss: refetch the menu either way
            document.dispatchEvent(new CustomEvent(ADMIN_TOOLS_CHANGED_EVENT));
        });
        connection.start();
        connection.subscribe(eventsTopic);
    };

    private reloadTimer: ReturnType<typeof setTimeout> | null = null;

    private scheduleMenuReload = (): void => {
        if (this.reloadTimer) {
            clearTimeout(this.reloadTimer);
        }
        this.reloadTimer = setTimeout(() => {
            this.reloadTimer = null;
            this.reloadMenu();
        }, RELOAD_DEBOUNCE_MS);
    };

    private reloadMenu = (): Promise<void> => {
        return this.fetchMenuContents()
            .then((doc: Document) => this.applyMenuContents(doc))
            .catch((e: Error) => {
                console.error('[xp-menu] Failed to reload menu:', e);
            });
    };

    private applyMenuContents = (doc: Document): void => {
        const oldGrid = this.menuPanel.querySelector('.app-grid');
        const newGrid = doc.querySelector('.app-grid');

        if (!oldGrid || !newGrid) {
            return;
        }

        if (this.sameGrid(oldGrid, newGrid)) {
            return;
        }

        const selectedToolId = this.getSelectedTool()?.getAttribute(TOOL_ID_ATTR);
        const focusedToolId = this.getFocusedTool()?.getAttribute(TOOL_ID_ATTR);

        oldGrid.parentNode.replaceChild(
            document.importNode(newGrid, true),
            oldGrid,
        );
        this.setFocusableElements();

        this.restoreSelectedTool(selectedToolId, focusedToolId);
    };

    private sameGrid = (oldGrid: Element, newGrid: Element): boolean => {
        const rendered = oldGrid.cloneNode(true) as Element;
        rendered.querySelectorAll('.selected').forEach(tool => tool.classList.remove('selected'));
        return rendered.outerHTML === newGrid.outerHTML;
    };

    private restoreSelectedTool = (selectedToolId: string | undefined, focusedToolId: string | undefined): void => {
        const tools = this.getTools();
        const find = (toolId: string | undefined): HTMLElement | undefined =>
            toolId ? tools.find(tool => tool.getAttribute(TOOL_ID_ATTR) === toolId) : undefined;

        find(selectedToolId)?.classList.add('selected');
        find(focusedToolId)?.focus();
    };

    private listenToMouseMove = (): void => window.addEventListener('mousemove', this.disableKeyboardNavigation, true);

    private disableKeyboardNavigation = (): void => {
        this.getMenuMainContainer().classList.remove('keyboard-navigation');
        this.unselectCurrentTool();
        window.removeEventListener('mousemove', this.disableKeyboardNavigation, true);
    };

    private initKeyboardNavigation = (): void => {
        const appContainer = this.getMenuMainContainer();
        if (!appContainer.classList.contains('keyboard-navigation')) {
            this.listenToMouseMove();
            appContainer.classList.add('keyboard-navigation');
        }
    };

    private getTools(): HTMLElement[] {
        return Array.from(this.getMenuMainContainer().querySelectorAll('.app-tile'));
    }

    private getSelectedTool = (): HTMLElement => this.menuPanel.querySelector('.app-tile.selected');

    private getSelectedToolIndex = (): number => {
        const tools = this.getTools();
        for (let i = 0; i < tools.length; i++) {
            if (tools[i].classList.contains('selected')) {
                return i;
            }
        }
        return -1;
    };

    private selectNextTool = (): void => {
        const firstAppIndex = 0;
        const selectedIndex = this.getSelectedToolIndex();
        const tools = this.getTools();

        this.selectTool(
            selectedIndex + 1 === tools.length || selectedIndex === -1
            ? firstAppIndex
            : selectedIndex + 1,
        );
    };

    private selectPreviousTool = (): void => {
        const selectedIndex = this.getSelectedToolIndex();
        let nextIndex;
        if (selectedIndex === -1) {
            nextIndex = 0;
        } else if (selectedIndex === 0) {
            nextIndex = this.root.querySelectorAll('.app-tile').length - 1;
        } else {
            nextIndex = selectedIndex - 1;
        }

        this.selectTool(nextIndex);
    };

    private selectTool = (index: number): void => {
        this.unselectCurrentTool();
        const tool = this.getToolByIndex(index);
        setTimeout(() => {
            (tool as HTMLElement).focus();
            tool.classList.add('selected');
        }, 1);
    };

    private getToolByIndex = (index: number): Element => {
        const tools = this.getTools();
        for (let i = 0; i < tools.length; i++) {
            if (i === index) {
                return tools[i];
            }
        }
        return null;
    };

    private openTool = (tool: HTMLElement): void => {
        if (tool.tagName === 'A' && tool.click) {
            this.unselectCurrentTool();
            tool.click();
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
