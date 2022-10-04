import * as Q from 'q';
import {GetDashboardWidgetsRequest} from './resource/widget/GetDashboardWidgetsRequest';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {H5El} from '@enonic/lib-admin-ui/dom/H5El';
import {Element as LibAdminElement} from '@enonic/lib-admin-ui/dom/Element';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {Exception} from '@enonic/lib-admin-ui/Exception';

export class WidgetPanel
    extends DivEl {

    private static widgetUrlPrefix: string;

    constructor() {
        super('widget-panel');

        WidgetPanel.widgetUrlPrefix = WidgetPanel.getUrlPrefix();
    }

    private static getUrlPrefix(): string {
        let baseUrl: string = document.location.href;
        if (!baseUrl.endsWith('/')) {
            baseUrl += '/';
        }

        return baseUrl;
    }

    fetchAndAppendWidgets(): void {
        new GetDashboardWidgetsRequest().fetchWidgets()
            .then((widgets: Widget[]) => {
                widgets.forEach((widget: Widget) => this.fetchAndAppendWidget(widget));
            })
            .catch(DefaultErrorHandler.handle);
    }

    private fetchAndAppendWidget(widget: Widget) {
        const widgetPlaceholder: LibAdminElement = this.createWidgetPlaceholder(widget);
        this.appendChild(widgetPlaceholder);

        widgetPlaceholder.render()
            .then(() => {
                const loadMask: LoadMask = new LoadMask(widgetPlaceholder);
                loadMask.show();

                return this.fetchWidget(widget, widgetPlaceholder).finally(() => loadMask.hide());
            })
            .catch(DefaultErrorHandler.handle);
    }

    private createWidgetPlaceholder(widget: Widget): LibAdminElement {
        const widthCls: string = widget.getConfig()['width'] || 'auto';
        const styleCls: string = widget.getConfig()['style'] || '';
        const widgetPlaceholder: LibAdminElement =
            new DivEl(`widget-placeholder width-${widthCls.toLowerCase()}${styleCls ? ` style-${styleCls.toLowerCase()}` : ''}`);

        if (styleCls !== 'custom') {
            widgetPlaceholder.appendChild(new H5El('widget-header').setHtml(widget.getDisplayName()));
        }

        return widgetPlaceholder;
    }

    private fetchWidget(widget: Widget, widgetContainer: LibAdminElement): Promise<void> {
        return fetch(WidgetPanel.widgetUrlPrefix + widget.getUrl())
            .then(response => response.text())
            .then((html: string) => {
                const sanitisedWidgetEl: LibAdminElement = this.getSanitisedWidget(widget, html);

                return this.injectWidgetAssets(sanitisedWidgetEl)
                    .then(() => {
                        widgetContainer.appendChild(sanitisedWidgetEl.addClass('widget-contents')).addClass('loaded');
                        return Q.resolve();
                    });
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
