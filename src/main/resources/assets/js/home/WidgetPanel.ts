import * as Q from 'q';
import {GetDashboardWidgetsRequest} from './resource/widget/GetDashboardWidgetsRequest';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {H5El} from '@enonic/lib-admin-ui/dom/H5El';
import {Element as LibAdminElement} from '@enonic/lib-admin-ui/dom/Element';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {Exception} from '@enonic/lib-admin-ui/Exception';
import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';

export class WidgetPanel
    extends DivEl {

    private static widgetUrlPrefix: string;

    private static widgetCache: Map<string, string[]> = new Map<string, string[]>();

    private widgetCount = 0;

    constructor() {
        super('widget-panel');

        WidgetPanel.widgetUrlPrefix = WidgetPanel.getUrlPrefix();
        this.addApplicationsListeners();
    }

    appendWidgets(): void {
        this.fetchWidgets()
            .then((widgets: Widget[]) => {
                if (widgets.length === this.widgetCount) {
                    return;
                }

                if (this.widgetCount > 0) {
                    this.removeChildren();
                }
                this.widgetCount = widgets.length;
                widgets
                    .sort((w1: Widget, w2: Widget) => this.sortByOrder(w1, w2))
                    .forEach((widget: Widget) => this.appendWidget(widget));
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
        const widgetKeys: string[] = WidgetPanel.widgetCache.get(applicationKey);
        if (widgetKeys) {
            this.removeWidgets(widgetKeys);
            WidgetPanel.widgetCache.delete(applicationKey);
        }
    }

    private isApplicationActivated(e: ApplicationEvent): boolean {
        return ApplicationEventType.STARTED === e.getEventType();
    }

    private handleApplicationActivated(applicationKey: string): void {
        if (WidgetPanel.widgetCache.has(applicationKey)) {
            this.updateWidgets(applicationKey);
        } else {
            this.appendWidgets();
        }
    }

    private removeWidgets(widgetKeys: string[]): void {
        widgetKeys.forEach((widgetKey: string) => {
            const widgetElement = this.findChildById(widgetKey, true);
            if (widgetElement) {
                this.widgetCount--;
                widgetElement.remove();
            }
        });
    }

    private static getUrlPrefix(): string {
        let baseUrl: string = document.location.href;
        if (!baseUrl.endsWith('/')) {
            baseUrl += '/';
        }

        return baseUrl;
    }

    private sortByOrder(widget1: Widget, widget2: Widget): number {
        return this.getWidgetOrder(widget1) - this.getWidgetOrder(widget2);
    }

    private getWidgetOrder(widget: Widget): number {
        const widgetOrder: string = widget.getConfig()['order'];
        return widgetOrder ? parseInt(widgetOrder) : Number.MAX_VALUE;
    }

    private fetchWidgets(): Q.Promise<Widget[]> {
        return new GetDashboardWidgetsRequest().fetchWidgets();
    }

    private updateWidgets(applicationKey: string): void {
        this.fetchWidgets()
            .then((widgets: Widget[]) => {
                if (widgets.length !== this.widgetCount) {
                    this.appendWidgets();
                    return;
                }

                widgets
                    .filter((widget: Widget) => widget.getWidgetDescriptorKey().getApplicationKey().toString() === applicationKey)
                    .forEach((widget: Widget) => this.updateWidget(widget));
            })
            .catch(DefaultErrorHandler.handle);
    }

    private appendWidget(widget: Widget, existingContainer?: LibAdminElement) {
        const widgetContainer: LibAdminElement = existingContainer || this.createWidgetPlaceholder(widget);
        if (!existingContainer) {
            this.appendChild(widgetContainer);
        }

        widgetContainer.render()
            .then(() => this.addWidget(widget, widgetContainer))
            .catch(DefaultErrorHandler.handle);
    }

    private updateWidget(widget: Widget) {
        const widgetContainer = this.findChildById(widget.getWidgetDescriptorKey().toString());
        if (!widgetContainer) {
            return;
        }

        const newWidgetContainer = this.createWidgetPlaceholder(widget);
        widgetContainer.replaceWith(newWidgetContainer);

        this.appendWidget(widget, newWidgetContainer);
    }

    private addWidget(widget: Widget, widgetContainer: LibAdminElement): void {
        const loadMask: LoadMask = new LoadMask(widgetContainer);
        loadMask.show();

        this.fetchAndRenderWidget(widget, widgetContainer).finally(() => loadMask.hide());
    }

    private createWidgetPlaceholder(widget: Widget): LibAdminElement {
        const widthCls: string = widget.getConfig()['width'] || 'auto';
        const styleCls: string = widget.getConfig()['style'] || '';
        const widgetPlaceholder: LibAdminElement =
            new DivEl(`widget-placeholder width-${widthCls.toLowerCase()}${styleCls ? ` style-${styleCls.toLowerCase()}` : ''}`);

        widgetPlaceholder.setId(widget.getWidgetDescriptorKey().toString());

        if (styleCls !== 'custom') {
            widgetPlaceholder.appendChild(new H5El('widget-header').setHtml(widget.getDisplayName()));
        }

        return widgetPlaceholder;
    }

    private static cacheWidgetKey(widget: Widget): void {
        const applicationKey: string = widget.getWidgetDescriptorKey().getApplicationKey().toString();
        const widgetKey: string = widget.getWidgetDescriptorKey().toString();

        const cachedWidgetKeys: string[] = WidgetPanel.widgetCache.get(applicationKey) || [];
        if (cachedWidgetKeys.includes(widgetKey)) {
            return;
        }

        cachedWidgetKeys.push(widgetKey);
        WidgetPanel.widgetCache.set(applicationKey, cachedWidgetKeys);
    }

    private fetchAndRenderWidget(widget: Widget, widgetContainer: LibAdminElement): Promise<void> {
        return fetch(WidgetPanel.widgetUrlPrefix + widget.getUrl())
            .then(response => response.text())
            .then((html: string) => {
                WidgetPanel.cacheWidgetKey(widget);
                return this.renderWidget(widget, widgetContainer, html);
            });
    }

    private renderWidget(widget: Widget, widgetContainer: LibAdminElement, html: string): Q.Promise<void> {
        const sanitisedWidgetEl: LibAdminElement = this.getSanitisedWidget(widget, html);

        return this.injectWidgetAssets(sanitisedWidgetEl)
            .then(() => {
                widgetContainer
                    .appendChild(sanitisedWidgetEl.addClass('widget-contents'))
                    .addClass('loaded');
                return Q.resolve();
            });
    }

    private getSanitisedWidget(widget: Widget, widgetHtml: string): LibAdminElement {
        const widgetEl: LibAdminElement = LibAdminElement.fromCustomarilySanitizedString(
            widgetHtml,
            true,
            {
                addTags: this.getAllowedWidgetTags(widget),
                addAttributes: ['target'],  // allow opening links in a new window
            },
        );

        if ('WIDGET' !== widgetEl.getHTMLElement().nodeName) {
            throw new Exception(`${widget.getWidgetDescriptorKey().toString()} is missing <widget> root element`);
        }

        return widgetEl;
    }

    private getAllowedWidgetTags(widget: Widget): string[] {
        const result: string[] = [
            'widget',
            'link', // allow widget assets
            'script',
        ];

        if (widget.getWidgetDescriptorKey().getName() === 'youtube') {
            result.push('iframe');
        }

        return result;
    }

    private injectWidgetAssets(widgetEl: LibAdminElement): Q.Promise<void[]>  {
        const promises: Q.Promise<void>[] = [];
        promises.push(...this.injectElements(widgetEl, 'link'));
        promises.push(...this.injectElements(widgetEl, 'script'));
        return Q.all(promises);
    }

    private injectElements(widgetEl: LibAdminElement, tag: string): Q.Promise<void>[] {
        const elements: HTMLCollectionOf<Element> = widgetEl.getHTMLElement().getElementsByTagName(tag);
        const elementsToRemove: Element[] = [];
        const promises: Q.Promise<void>[] = [];

        for (let i = 0; i < elements.length; i++) {
            const deferred: Q.Deferred<void> = Q.defer<void>();
            promises.push(deferred.promise);
            const el: Element = elements.item(i);
            elementsToRemove.push(el);

            const newElement: HTMLElement = document.createElement(tag);
            newElement.onload = () => deferred.resolve();
            newElement.onerror = () => deferred.resolve();

            el.getAttributeNames().forEach((attr: string) => {
                newElement.setAttribute(attr, el.getAttribute(attr));
            });

            document.head.appendChild(newElement);
        }

        elementsToRemove.forEach((el: Element) => el.remove());

        return promises;
    }
}
