import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element as LibAdminElement} from '@enonic/lib-admin-ui/dom/Element';
import {H5El} from '@enonic/lib-admin-ui/dom/H5El';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {DashboardExtension} from './resource/extension/DashboardExtension';
import {GetDashboardExtensionsRequest} from './resource/extension/GetDashboardExtensionsRequest';
import {DashboardExtensionElement} from './DashboardExtensionElement';

export class DashboardPanel
    extends DivEl {

    private static cache: Map<string, string[]> = new Map<string, string[]>();

    private extensionCount = 0;

    private readonly sidebar: DivEl;

    private readonly grid: DivEl;

    private emptyState: DivEl | null = null;

    constructor() {
        super('dashboard-widget-panel');

        this.sidebar = this.createSidebar();
        this.grid = new DivEl('dashboard-widgets-grid');
        this.appendChild(this.sidebar);
        this.appendChild(this.grid);

        this.showEmptyState();

        this.addApplicationsListeners();
    }

    private createSidebar(): DivEl {
        const sidebar = new DivEl('dashboard-sidebar');
        const logo = new DivEl('dashboard-sidebar-logo');
        logo.setHtml(
            `<svg width="25" height="28" viewBox="0 0 25 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
            `<path fill-rule="evenodd" clip-rule="evenodd" d="M2.62435 11.6897C3.5303 6.55501 7.63631 2.65065 12.4203 2.65065C17.2029 2.65065 21.306 6.55501 22.2119 11.6897H24.8407C23.9011 5.16101 18.7445 0 12.4203 0C6.14441 0 0.945406 5.16101 0 11.6897H2.62435Z" fill="currentColor"/>` +
            `<path fill-rule="evenodd" clip-rule="evenodd" d="M22.2178 16.3125C21.3498 21.4384 17.2321 25.3165 12.4218 25.3165C7.60855 25.3165 3.48792 21.4384 2.62288 16.3125H0C0.90157 22.8266 6.11665 27.9964 12.4218 27.9964C18.7722 27.9964 23.9479 22.8266 24.8407 16.3125H22.2178Z" fill="currentColor"/>` +
            `</svg>`,
            false
        );
        const title = new SpanEl('dashboard-sidebar-title');
        title.setHtml(i18n('home.dashboard'));
        sidebar.appendChild(logo);
        sidebar.appendChild(title);
        return sidebar;
    }

    private showEmptyState(): void {
        if (this.emptyState) {
            return;
        }
        this.emptyState = new DivEl('dashboard-empty-state');
        this.emptyState.setHtml(i18n('home.dashboard.noWidgets'));
        this.grid.appendChild(this.emptyState);
    }

    private hideEmptyState(): void {
        if (this.emptyState) {
            this.emptyState.remove();
            this.emptyState = null;
        }
    }

    appendExtensions(): void {
        this.fetchExtensions()
            .then((extensions: DashboardExtension[]) => {
                if (extensions.length === this.extensionCount && extensions.length > 0) {
                    return;
                }

                if (this.extensionCount > 0) {
                    this.grid.removeChildren();
                }
                this.extensionCount = extensions.length;

                if (extensions.length === 0) {
                    this.showEmptyState();
                    return;
                }

                this.hideEmptyState();
                extensions
                    .sort((w1: DashboardExtension, w2: DashboardExtension) => this.sortByOrder(w1, w2))
                    .forEach((extension: DashboardExtension) => this.appendExtension(extension));
            })
            .catch(DefaultErrorHandler.handle);
    }

    private addApplicationsListeners(): void {
        ApplicationEvent.on((e: ApplicationEvent) => {
            const applicationKey: string = e.getApplicationKey().toString();
            if (this.isApplicationDeactivated(e)) {
                this.handleApplicationDeactivated(applicationKey);
            } else if (this.isApplicationActivated(e)) {
                this.handleApplicationActivated(applicationKey);
            }
        });
    }

    private isApplicationDeactivated(e: ApplicationEvent): boolean {
        const eventType: ApplicationEventType = e.getEventType();
        return ApplicationEventType.STOPPED === eventType || ApplicationEventType.UNINSTALLED === eventType;
    }

    private handleApplicationDeactivated(applicationKey: string): void {
        const extensionKeys: string[] = DashboardPanel.cache.get(applicationKey);
        if (extensionKeys) {
            this.removeExtensions(extensionKeys);
            DashboardPanel.cache.delete(applicationKey);
        }
    }

    private isApplicationActivated(e: ApplicationEvent): boolean {
        return ApplicationEventType.STARTED === e.getEventType();
    }

    private handleApplicationActivated(applicationKey: string): void {
        if (DashboardPanel.cache.has(applicationKey)) {
            this.updateExtensions(applicationKey);
        } else {
            this.appendExtensions();
        }
    }

    private removeExtensions(extensionKeys: string[]): void {
        extensionKeys.forEach((extensionKey: string) => {
            const extensionElement = this.grid.findChildById(extensionKey, true);
            if (extensionElement) {
                this.extensionCount -= 1;
                extensionElement.remove();
            }
        });
        if (this.extensionCount === 0) {
            this.showEmptyState();
        }
    }

    private sortByOrder(extension1: DashboardExtension, extension2: DashboardExtension): number {
        return extension1.getOrder() - extension2.getOrder();
    }

    private fetchExtensions(): Q.Promise<DashboardExtension[]> {
        return new GetDashboardExtensionsRequest().fetchExtensions();
    }

    private updateExtensions(applicationKey: string): void {
        this.fetchExtensions()
            .then((extensions: DashboardExtension[]) => {
                if (extensions.length !== this.extensionCount) {
                    this.appendExtensions();
                    return;
                }

                extensions
                    .filter((extension: DashboardExtension) =>
                        extension.getDescriptorKey().getApplicationKey().toString() === applicationKey
                    )
                    .forEach((extension: DashboardExtension) => this.updateExtension(extension));
            })
            .catch(DefaultErrorHandler.handle);
    }

    private appendExtension(extension: DashboardExtension, existingContainer?: LibAdminElement) {
        const extensionPlaceholder: LibAdminElement = existingContainer || this.createExtensionPlaceholder(extension);
        if (!existingContainer) {
            this.grid.appendChild(extensionPlaceholder);
        }

        extensionPlaceholder.render()
            .then(() => this.fetchAndRenderExtension(extension, extensionPlaceholder))
            .catch(DefaultErrorHandler.handle);
    }

    private updateExtension(extension: DashboardExtension) {
        const extensionContainer = this.grid.findChildById(extension.getDescriptorKey().toString());
        if (!extensionContainer) {
            return;
        }

        const newExtensionContainer = this.createExtensionPlaceholder(extension);
        extensionContainer.replaceWith(newExtensionContainer);

        this.appendExtension(extension, newExtensionContainer);
    }

    private createExtensionPlaceholder(extension: DashboardExtension): LibAdminElement {
        const widthCls = ` width-${extension.getWidth().toLowerCase()}`;
        const heightCls = ` height-${extension.getHeight().toLowerCase()}`;
        const styleCls: string = extension.hasCustomStyling() ? ` style-${extension.getStyle().toLowerCase()}` : '';
        const extensionPlaceholder: LibAdminElement = new DivEl(`extension-placeholder${widthCls}${heightCls}${styleCls}`);

        extensionPlaceholder.setId(extension.getDescriptorKey().toString());

        return extensionPlaceholder;
    }

    private static cacheExtensionKey(extension: DashboardExtension): void {
        const applicationKey: string = extension.getDescriptorKey().getApplicationKey().toString();
        const extensionKey: string = extension.getDescriptorKey().toString();

        const cachedExtensionKeys: string[] = DashboardPanel.cache.get(applicationKey) || [];
        if (cachedExtensionKeys.includes(extensionKey)) {
            return;
        }

        cachedExtensionKeys.push(extensionKey);
        DashboardPanel.cache.set(applicationKey, cachedExtensionKeys);
    }

    private fetchAndRenderExtension(extension: DashboardExtension, extensionPlaceholder: LibAdminElement): Promise<void> {
        let loading = true;
        let loadMask: LoadMask;
        setTimeout(() => {
            if (loading) {
                loadMask = new LoadMask(extensionPlaceholder);
                loadMask.show();
            }
        }, 300);
        return fetch(extension.getFullUrl())
            .then(response => {
                loading = false;
                return response.text();
            })
            .then((html: string) => {
                DashboardPanel.cacheExtensionKey(extension);
                return this.renderExtension(extension, extensionPlaceholder, html);
            })
            .catch(() => console.error(`Failed to fetch extension ${extension.getDisplayName()}`))
            .finally(() => {
                if (loadMask) {
                    loadMask.hide();
                }
            });
    }

    private renderExtension(extension: DashboardExtension, extensionPlaceholder: LibAdminElement, html: string): Promise<void> {
        const extensionContainer = new DivEl('extension-container');

        if (extension.hasHeader()) {
            extensionContainer.appendChild(new H5El('extension-header').setHtml(extension.getDisplayName()));
        }

        const extensionElement = DashboardExtensionElement.create();
        extensionContainer.getHTMLElement().appendChild(extensionElement);
        extensionPlaceholder.appendChild(extensionContainer);
        extensionPlaceholder.addClass('loaded');

        return extensionElement.setHtml(html);
    }
}
