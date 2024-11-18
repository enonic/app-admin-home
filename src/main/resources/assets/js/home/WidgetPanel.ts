import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element as LibAdminElement} from '@enonic/lib-admin-ui/dom/Element';
import {H5El} from '@enonic/lib-admin-ui/dom/H5El';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import * as Q from 'q';
import {DashboardWidget} from './resource/widget/DashboardWidget';
import {GetDashboardWidgetsRequest} from './resource/widget/GetDashboardWidgetsRequest';
import {WidgetElement, WidgetHelper} from '@enonic/lib-admin-ui/widget/WidgetHelper';

export class WidgetPanel
    extends DivEl {

    private static widgetCache: Map<string, string[]> = new Map<string, string[]>();

    private widgetCount = 0;

    constructor() {
        super('widget-panel');

        this.addApplicationsListeners();
    }

    appendWidgets(): void {
        this.fetchWidgets()
            .then((widgets: DashboardWidget[]) => {
                if (widgets.length === this.widgetCount) {
                    return;
                }

                if (this.widgetCount > 0) {
                    this.removeChildren();
                }
                this.widgetCount = widgets.length;
                widgets
                    .sort((w1: DashboardWidget, w2: DashboardWidget) => this.sortByOrder(w1, w2))
                    .forEach((widget: DashboardWidget) => this.appendWidget(widget));
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
                this.widgetCount -= 1;
                widgetElement.remove();
            }
        });
    }

    private sortByOrder(widget1: DashboardWidget, widget2: DashboardWidget): number {
        return widget1.getOrder() - widget2.getOrder();
    }

    private fetchWidgets(): Q.Promise<DashboardWidget[]> {
        return new GetDashboardWidgetsRequest().fetchWidgets();
    }

    private updateWidgets(applicationKey: string): void {
        this.fetchWidgets()
            .then((widgets: DashboardWidget[]) => {
                if (widgets.length !== this.widgetCount) {
                    this.appendWidgets();
                    return;
                }

                widgets
                    .filter((widget: DashboardWidget) =>
                        widget.getWidgetDescriptorKey().getApplicationKey().toString() === applicationKey
                    )
                    .forEach((widget: DashboardWidget) => this.updateWidget(widget));
            })
            .catch(DefaultErrorHandler.handle);
    }

    private appendWidget(widget: DashboardWidget, existingContainer?: LibAdminElement) {
        const widgetContainer: LibAdminElement = existingContainer || this.createWidgetPlaceholder(widget);
        if (!existingContainer) {
            this.appendChild(widgetContainer);
        }

        widgetContainer.render()
            .then(() => this.fetchAndRenderWidget(widget, widgetContainer))
            .catch(DefaultErrorHandler.handle);
    }

    private updateWidget(widget: DashboardWidget) {
        const widgetContainer = this.findChildById(widget.getWidgetDescriptorKey().toString());
        if (!widgetContainer) {
            return;
        }

        const newWidgetContainer = this.createWidgetPlaceholder(widget);
        widgetContainer.replaceWith(newWidgetContainer);

        this.appendWidget(widget, newWidgetContainer);
    }

    private createWidgetPlaceholder(widget: DashboardWidget): LibAdminElement {
        const widthCls = ` width-${widget.getWidth().toLowerCase()}`;
        const heightCls = ` height-${widget.getHeight().toLowerCase()}`;
        const styleCls: string = widget.hasCustomStyling() ? ` style-${widget.getStyle().toLowerCase()}` : '';
        const widgetPlaceholder: LibAdminElement = new DivEl(`widget-placeholder${widthCls}${heightCls}${styleCls}`);

        widgetPlaceholder.setId(widget.getWidgetDescriptorKey().toString());

        return widgetPlaceholder;
    }

    private static cacheWidgetKey(widget: DashboardWidget): void {
        const applicationKey: string = widget.getWidgetDescriptorKey().getApplicationKey().toString();
        const widgetKey: string = widget.getWidgetDescriptorKey().toString();

        const cachedWidgetKeys: string[] = WidgetPanel.widgetCache.get(applicationKey) || [];
        if (cachedWidgetKeys.includes(widgetKey)) {
            return;
        }

        cachedWidgetKeys.push(widgetKey);
        WidgetPanel.widgetCache.set(applicationKey, cachedWidgetKeys);
    }

    private fetchAndRenderWidget(widget: DashboardWidget, widgetContainer: LibAdminElement): Promise<void> {
        let loading = true;
        let loadMask: LoadMask;
        setTimeout(() => {
            if (loading) {
                loadMask = new LoadMask(widgetContainer);
                loadMask.show();
            }
        }, 300);
        return fetch(widget.getUrl())
            .then(response => {
                loading = false;
                return response.text();
            })
            .then((html: string) => {
                WidgetPanel.cacheWidgetKey(widget);
                return this.renderWidget(widget, widgetContainer, html);
            })
            .catch(() => console.error(`Failed to fetch widget ${widget.getDisplayName()}`))
            .finally(() => {
                if (loadMask) {
                    loadMask.hide();
                }
            });
    }

    private renderWidget(widget: DashboardWidget, widgetContainer: LibAdminElement, html: string): Q.Promise<void> {
         return WidgetHelper.createFromHtmlAndAppend(html, widgetContainer)
            .then(({el}: WidgetElement) => {
                if (widget.hasHeader()) {
                    el.insertChild(new H5El('widget-header').setHtml(widget.getDisplayName()), 0);
                }

                el.addClass('widget-contents');
                widgetContainer.addClass('loaded');

                return Q.resolve();
            });
    }
}
