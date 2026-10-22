import {createAdminEvents, createTopicReaction, documentVisibility} from '@enonic/ui-utils/admin-events';
import {useEffect, useRef, useState} from 'preact/hooks';
import {fetchMenuData, type MenuData} from './data';
import {InlineHtml} from '../shared/InlineHtml';
import type {MenuOptions, MenuTheme} from './mount';

const importHubClient = (url: string): Promise<unknown> => import(/* @vite-ignore */ url).catch((e: unknown) => {
    console.warn(
        `[xp-menu] The admin events hub is not reachable at ${url}: the tools list will not refresh until the page reloads. `
        + 'The hub is mounted under the admin tool that hosts the menu, so that tool has to list "admin:events" in the `apis` of its descriptor.',
    );
    throw e;
});

const THEME_STORAGE_KEY = 'enonic:theme';

const THEME_CHANGE_EVENT = 'enonic:theme';

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

interface MenuProps {
    data: MenuData;
    options: MenuOptions;
    root: ShadowRoot;
}

const cls = (...names: (string | false | null | undefined)[]): string => names.filter(Boolean).join(' ');

const storedTheme = (): string | null => {
    try {
        return localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
        return null;
    }
};

const resolveDark = (theme?: MenuTheme): boolean => {
    if (theme) {
        return theme === 'dark';
    }
    const stored = storedTheme();
    if (stored === 'light' || stored === 'dark') {
        return stored === 'dark';
    }
    return window.matchMedia(DARK_SCHEME_QUERY).matches;
};

const useDarkTheme = (theme?: MenuTheme): boolean => {
    const [dark, setDark] = useState(() => resolveDark(theme));

    useEffect(() => {
        if (theme) {
            return;
        }
        const update = (): void => setDark(resolveDark());
        const onStorage = (e: StorageEvent): void => {
            if (e.key === THEME_STORAGE_KEY || e.key === null) {
                update();
            }
        };
        const media = window.matchMedia(DARK_SCHEME_QUERY);
        const observer = new MutationObserver(update);
        window.addEventListener('storage', onStorage);
        window.addEventListener(THEME_CHANGE_EVENT, update);
        media.addEventListener('change', update);
        observer.observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener(THEME_CHANGE_EVENT, update);
            media.removeEventListener('change', update);
            observer.disconnect();
        };
    }, [theme]);

    return dark;
};

const useMenuData = (initial: MenuData, menuUrl: string): MenuData => {
    const [data, setData] = useState(initial);

    useEffect(() => {
        const events = initial.events;
        if (!events) {
            return;
        }
        let active = true;
        const reload = (): void => {
            fetchMenuData(menuUrl)
                .then(fresh => {
                    if (active) {
                        setData(fresh);
                    }
                })
                .catch(e => console.error('[xp-menu] Failed to reload menu:', e));
        };
        const hub = createAdminEvents(events.url, importHubClient);
        const reaction = createTopicReaction({
            events: hub,
            topic: events.topic,
            parse: () => true,
            visible: documentVisibility(),
            apply: reload,
            refresh: reload,
        });
        reaction.start();
        hub.connect();

        return () => {
            active = false;
            reaction.stop();
        };
    }, [menuUrl]);

    return data;
};

const LogoIcon = () => (
    <svg class="menu-icon menu-icon-logo" width="30" height="30" viewBox="0 0 120 120" fill="none" aria-hidden="true">
        <path d="M61.3332 78.8174H52.3812L44.573 66.8814L36.7151 78.8174H28.0117L40.1467 61.1123L28.5091 44.0039H37.4611L44.7719 55.2934L52.1325 44.0039H60.8359L49.1982 61.0128L61.3332 78.8174Z" fill="currentColor"/>
        <path d="M94.626 56.1389C94.626 64.1958 88.3596 68.3734 80.5514 68.3734H74.7326V78.8174H67.0736V44.0039H81.2974C89.6029 44.0039 94.626 48.9275 94.626 56.0394V56.1389ZM86.8676 56.2881V56.1886C86.8676 52.757 84.4803 50.9169 80.6509 50.9169H74.7326V61.5599H80.8001C84.6295 61.5599 86.8676 59.2721 86.8676 56.2881Z" fill="currentColor"/>
        <path d="M120.007 69.7227C115.296 98.2834 90.1728 120.004 60.0039 120.004C29.835 120.004 4.71142 98.2834 0.000976562 69.7227H10.0254C14.6194 92.7211 35.1984 110.144 60.0039 110.145C84.8094 110.144 105.389 92.7211 109.983 69.7227H120.007ZM60.0039 0C90.1747 0.000129089 115.3 21.7227 120.008 50.2861H109.984C105.392 27.285 84.8114 9.8595 60.0039 9.85938C35.1964 9.85945 14.6162 27.285 10.0244 50.2861H0C4.70815 21.7227 29.8331 7.50718e-05 60.0039 0Z" fill="currentColor"/>
    </svg>
);

const CloseIcon = () => (
    <svg class="menu-icon menu-icon-active" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
        <path d="M19.3614 9.28118C19.7363 8.90627 20.344 8.90627 20.7188 9.28118C21.0937 9.65609 21.0937 10.2638 20.7188 10.6387L16.3576 15.0001L20.7188 19.3613C21.0937 19.7363 21.0937 20.344 20.7188 20.7189C20.344 21.0938 19.7363 21.0937 19.3614 20.7189L15 16.3575L10.6387 20.7189C10.2638 21.0938 9.6561 21.0937 9.28119 20.7189C8.90627 20.344 8.90627 19.7363 9.28119 19.3613L13.6425 15.0001L9.28119 10.6387C8.90627 10.2638 8.90627 9.65608 9.28119 9.28118C9.65609 8.90627 10.2638 8.90627 10.6387 9.28118L15 13.6425L19.3614 9.28118Z" fill="currentColor"/>
        <path d="M30.001 17.4316C28.8231 24.5721 22.5435 30.0029 15.001 30.0029C7.45842 30.0029 1.17886 24.5721 0.000976562 17.4316H2.50586C3.65457 23.1816 8.79927 27.5381 15.001 27.5381C21.2027 27.5381 26.3474 23.1816 27.4961 17.4316H30.001ZM15.001 0C22.5441 1.37334e-05 28.8247 5.43106 30.002 12.5723H27.4961C26.348 6.8217 21.2032 2.46486 15.001 2.46484C8.79876 2.46484 3.654 6.82169 2.50586 12.5723H0C1.17721 5.43105 7.45785 0 15.001 0Z" fill="currentColor"/>
    </svg>
);

export const Menu = ({data: initial, options, root}: MenuProps) => {
    const data = useMenuData(initial, options.menuUrl);
    const dark = useDarkTheme(options.theme);
    const [open, setOpen] = useState(options.autoOpen === true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [keyboardNav, setKeyboardNav] = useState(false);
    const [avatarOpen, setAvatarOpen] = useState(false);
    const [backgroundLoaded, setBackgroundLoaded] = useState(false);

    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const avatarButtonRef = useRef<HTMLButtonElement>(null);
    const avatarContainerRef = useRef<HTMLDivElement>(null);
    const avatarDropdownRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const wasOpen = useRef(open);
    const focusFirstAvatarItem = useRef(false);
    const backgroundReady = useRef(false);

    const {tools, phrases, user} = data;
    const hideButton = open && options.hideButtonWhenOpen === true;
    const selectedIndex = tools.findIndex(tool => tool.id === selectedId);

    const getTiles = (): HTMLElement[] => Array.from(gridRef.current?.querySelectorAll<HTMLElement>('.app-tile') ?? []);

    const getFocusedTile = (): HTMLElement | null => {
        const active = root.activeElement;
        return active instanceof HTMLElement && active.classList.contains('app-tile') ? active : null;
    };

    const selectTool = (index: number): void => {
        setSelectedId(tools[index]?.id ?? null);
    };

    const navigateTo = (index: number): void => {
        setKeyboardNav(true);
        selectTool(index);
    };

    const focusEntry = (): void => {
        (hideButton ? avatarButtonRef : menuButtonRef).current?.focus();
    };

    useEffect(() => {
        if (selectedId == null) {
            return;
        }
        getTiles().find(tile => tile.dataset.toolId === selectedId)?.focus();
    }, [selectedId]);

    useEffect(() => {
        if (!keyboardNav) {
            return;
        }
        const stop = (): void => {
            setKeyboardNav(false);
            setSelectedId(null);
        };
        window.addEventListener('mousemove', stop, true);
        return () => window.removeEventListener('mousemove', stop, true);
    }, [keyboardNav]);

    useEffect(() => {
        if (open) {
            menuButtonRef.current?.focus();
        } else {
            setAvatarOpen(false);
            setSelectedId(null);
            if (wasOpen.current) {
                menuButtonRef.current?.focus();
                document.dispatchEvent(new CustomEvent('menu-panel-closed'));
            }
        }
        wasOpen.current = open;
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }
        const onKeyDown = (e: KeyboardEvent): void => {
            const tiles = getTiles();
            switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (avatarOpen) {
                    if (!avatarDropdownRef.current?.contains(root.activeElement)) {
                        e.stopPropagation();
                        avatarDropdownRef.current?.querySelector<HTMLElement>('.avatar-dropdown-item')?.focus();
                    }
                    return;
                }
                navigateTo(selectedIndex < 0 || selectedIndex + 1 === tools.length ? 0 : selectedIndex + 1);
                return;
            case 'ArrowUp':
                e.preventDefault();
                if (avatarOpen) {
                    return;
                }
                navigateTo(selectedIndex <= 0 ? (selectedIndex < 0 ? 0 : tools.length - 1) : selectedIndex - 1);
                return;
            case 'Tab': {
                if (e.shiftKey) {
                    const focused = getFocusedTile();
                    const index = selectedIndex >= 0 ? selectedIndex : (focused ? tiles.indexOf(focused) : -1);
                    if (index < 0) {
                        return;
                    }
                    e.preventDefault();
                    if (index === 0) {
                        setSelectedId(null);
                        focusEntry();
                    } else {
                        navigateTo(index - 1);
                    }
                    return;
                }
                if (selectedIndex < 0) {
                    return;
                }
                e.preventDefault();
                if (selectedIndex >= tools.length - 1) {
                    setSelectedId(null);
                    avatarButtonRef.current?.focus();
                } else {
                    navigateTo(selectedIndex + 1);
                }
                return;
            }
            case 'Enter': {
                if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
                    return;
                }
                const tile = (selectedIndex >= 0 ? tiles[selectedIndex] : null) ?? getFocusedTile();
                if (tile) {
                    e.preventDefault();
                    setSelectedId(null);
                    tile.click();
                } else if (root.activeElement === menuButtonRef.current) {
                    e.preventDefault();
                    setOpen(false);
                }
                return;
            }
            default:
                return;
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, avatarOpen, selectedIndex, tools, hideButton]);

    useEffect(() => {
        const onClick = (e: MouseEvent): void => {
            const container = avatarContainerRef.current;
            if (container && !e.composedPath().includes(container)) {
                setAvatarOpen(false);
            }
        };
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, []);

    useEffect(() => {
        if (avatarOpen && focusFirstAvatarItem.current) {
            avatarDropdownRef.current?.querySelector<HTMLElement>('.avatar-dropdown-item')?.focus();
        }
        focusFirstAvatarItem.current = false;
    }, [avatarOpen]);

    useEffect(() => {
        setBackgroundLoaded(false);
        const img = new Image();
        const settle = (): void => setBackgroundLoaded(true);
        img.onload = settle;
        img.onerror = settle;
        img.src = data.assets.background;
        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [data.assets.background]);

    const onMenuButtonKeyDown = (e: KeyboardEvent): void => {
        if (e.key !== 'Tab') {
            return;
        }
        if (e.shiftKey) {
            e.preventDefault();
            avatarButtonRef.current?.focus();
            return;
        }
        if (!open) {
            return;
        }
        e.preventDefault();
        selectTool(0);
    };

    const onAvatarButtonClick = (): void => {
        avatarButtonRef.current?.focus();
        setAvatarOpen(expanded => !expanded);
    };

    const onAvatarButtonKeyDown = (e: KeyboardEvent): void => {
        switch (e.key) {
        case 'Enter':
            e.preventDefault();
            setAvatarOpen(expanded => !expanded);
            return;
        case 'Escape':
            setAvatarOpen(false);
            avatarButtonRef.current?.focus();
            return;
        case 'ArrowDown':
            e.preventDefault();
            e.stopPropagation();
            if (avatarOpen) {
                avatarDropdownRef.current?.querySelector<HTMLElement>('.avatar-dropdown-item')?.focus();
            } else {
                focusFirstAvatarItem.current = true;
                setAvatarOpen(true);
            }
            return;
        case 'Tab':
            e.preventDefault();
            if (!e.shiftKey) {
                if (hideButton) {
                    selectTool(0);
                } else {
                    menuButtonRef.current?.focus();
                }
            } else if (tools.length > 0) {
                selectTool(tools.length - 1);
            } else {
                menuButtonRef.current?.focus();
            }
            return;
        default:
            return;
        }
    };

    const onAvatarDropdownKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            setAvatarOpen(false);
            avatarButtonRef.current?.focus();
        } else if (e.key === 'Enter') {
            const active = root.activeElement;
            if (active instanceof HTMLElement && avatarDropdownRef.current?.contains(active)) {
                e.preventDefault();
                e.stopPropagation();
                active.click();
            }
        }
    };

    const onAvatarFocusOut = (): void => {
        requestAnimationFrame(() => {
            const container = avatarContainerRef.current;
            if (!container) {
                return;
            }
            const inside = container.contains(root.activeElement) || container.contains(document.activeElement);
            if (!inside) {
                setAvatarOpen(false);
            }
        });
    };

    const onBackgroundTransitionEnd = (): void => {
        if (backgroundLoaded && !backgroundReady.current) {
            backgroundReady.current = true;
            document.dispatchEvent(new CustomEvent('menu-background-ready'));
        }
    };

    const buttonTitle = open ? phrases.closeMenu : phrases.openMenu;

    return (
        <div class={cls('menu-root', dark && 'dark')}>
            <button
                id="menu-button"
                ref={menuButtonRef}
                class={cls('menu-button', 'visible', open && 'toggled', open && 'menu-open')}
                hidden={hideButton}
                tabIndex={hideButton ? -1 : undefined}
                title={buttonTitle}
                aria-label={buttonTitle}
                aria-expanded={open}
                aria-controls="menu-panel"
                onClick={() => setOpen(expanded => !expanded)}
                onKeyDown={onMenuButtonKeyDown}
            >
                <LogoIcon/>
                <CloseIcon/>
            </button>
            <nav id="menu-panel" class={cls('menu-panel', open && 'visible')} role="navigation" aria-label={phrases.openMenu}>
                <div
                    class={cls('menu-background', backgroundLoaded && 'loaded')}
                    aria-hidden="true"
                    style={{backgroundImage: `url('${data.assets.background}')`}}
                    onTransitionEnd={onBackgroundTransitionEnd}
                />
                <div id="menu-main-container" class={cls('menu-main-container', keyboardNav && 'keyboard-navigation')}>
                    <div class="menu-info-panel">
                        <div class="menu-info-content">
                            <h1 class="menu-info-title">{data.installation}</h1>
                            <p class="menu-info-version">Enonic XP {data.xpVersion}</p>
                            <nav class="menu-info-links" aria-label={phrases.usefulLinks}>
                                <h2 class="menu-info-links-title">{phrases.usefulLinks}</h2>
                                {data.links.map(link => (
                                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" class="menu-info-link-row" tabIndex={-1}>
                                        <img src={link.iconUrl} alt="" class="menu-info-link-icon"/>
                                        <span class="menu-info-link-caption">{link.caption}</span>
                                    </a>
                                ))}
                            </nav>
                        </div>
                    </div>
                    <div class="menu-app-container">
                        <div class="app-grid" ref={gridRef}>
                            {tools.map(tool => (
                                <a
                                    key={tool.id}
                                    href={tool.url}
                                    class={cls('app-tile', tool.id === selectedId && 'selected')}
                                    data-tool-id={tool.id}
                                    title={tool.description}
                                    aria-description={tool.description}
                                >
                                    <InlineHtml class="app-tile-icon" html={tool.icon}/>
                                    <span class="app-tile-name">{tool.title}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </nav>
            <div class="avatar-container" ref={avatarContainerRef} onFocusOut={onAvatarFocusOut}>
                <button
                    id="avatar-button"
                    ref={avatarButtonRef}
                    type="button"
                    class={cls('avatar-button', open && 'menu-open')}
                    title={user.displayName}
                    aria-expanded={avatarOpen}
                    aria-haspopup="true"
                    aria-controls="avatar-dropdown"
                    tabIndex={open ? undefined : -1}
                    onClick={onAvatarButtonClick}
                    onKeyDown={onAvatarButtonKeyDown}
                >
                    {user.initials}
                </button>
                <div id="avatar-dropdown" ref={avatarDropdownRef} class={cls('avatar-dropdown', avatarOpen && 'expanded')} role="menu" onKeyDown={onAvatarDropdownKeyDown}>
                    <div class="avatar-dropdown-username">{user.displayName}</div>
                    <a href={data.logoutUrl} class="avatar-dropdown-item" role="menuitem">{phrases.logout}</a>
                </div>
            </div>
        </div>
    );
};
