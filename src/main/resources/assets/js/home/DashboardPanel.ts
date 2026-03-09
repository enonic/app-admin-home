import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element as LibAdminElement} from '@enonic/lib-admin-ui/dom/Element';
import {H5El} from '@enonic/lib-admin-ui/dom/H5El';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import * as Q from 'q';
import {DashboardExtension} from './resource/extension/DashboardExtension';
import {GetDashboardExtensionsRequest} from './resource/extension/GetDashboardExtensionsRequest';
import {DashboardExtensionElement} from './DashboardExtensionElement';

export class DashboardPanel
    extends DivEl {

    private static cache: Map<string, string[]> = new Map<string, string[]>();

    private extensionCount = 0;

    constructor() {
        super('dashboard-extension-panel');

        this.addApplicationsListeners();
    }

    appendExtensions(): void {
        this.fetchExtensions()
            .then((extensions: DashboardExtension[]) => {
                if (extensions.length === this.extensionCount) {
                    return;
                }

                if (this.extensionCount > 0) {
                    this.removeChildren();
                }
                this.extensionCount = extensions.length;
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
            const extensionElement = this.findChildById(extensionKey, true);
            if (extensionElement) {
                this.extensionCount -= 1;
                extensionElement.remove();
            }
        });
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
            this.appendChild(extensionPlaceholder);
        }

        extensionPlaceholder.render()
            .then(() => this.fetchAndRenderExtension(extension, extensionPlaceholder))
            .catch(DefaultErrorHandler.handle);
    }

    private updateExtension(extension: DashboardExtension) {
        const extensionContainer = this.findChildById(extension.getDescriptorKey().toString());
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
