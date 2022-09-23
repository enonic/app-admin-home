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

    constructor() {
        super('widget-panel');
    }

    fetchAndAppendWidgets(): void {
        new GetDashboardWidgetsRequest().fetchWidgets()
            .then((widgets: Widget[]) => {
                let baseUrl: string = document.location.href;
                if (!baseUrl.endsWith('/')) {
                    baseUrl += '/';
                }

                widgets.forEach((widget: Widget) => this.fetchAndAppendWidget(widget, baseUrl));
            })
            .catch(DefaultErrorHandler.handle);
    }

    private fetchAndAppendWidget(widget: Widget, baseUrl: string) {
        const widgetWidthCls: string = widget.getConfig()['width'] || 'auto';
        const widgetPlaceholder: LibAdminElement = new DivEl(`widget-placeholder ${widgetWidthCls}`)
                                            .appendChild(new H5El('widget-header').setHtml(widget.getDisplayName()));
        this.appendChild(widgetPlaceholder);

        widgetPlaceholder.render()
            .then(() => {
                const loadMask: LoadMask = new LoadMask(widgetPlaceholder);
                loadMask.show();

                fetch(baseUrl + widget.getUrl())
                    .then(response => response.text())
                    .then((html: string) => {
                        const sanitisedWidgetEl: LibAdminElement = this.getSanitisedWidget(widget, html);

                        this.injectWidgetAssets(sanitisedWidgetEl)
                            .then(() => {
                                widgetPlaceholder.appendChild(sanitisedWidgetEl.addClass('widget-contents'));
                                widgetPlaceholder.addClass('loaded');
                            })
                            .catch(DefaultErrorHandler.handle)
                            .finally(() => loadMask.hide());
                    })
                    .catch(DefaultErrorHandler.handle);
            })
            .catch(DefaultErrorHandler.handle);
    }

    private getSanitisedWidget(widget: Widget, widgetHtml: string): LibAdminElement {
        const widgetEl: LibAdminElement = LibAdminElement.fromCustomarilySanitizedString(
            widgetHtml,
            true,
            {
                addTags: [
                    'widget',
                    'link', // allow widget assets
                    'script',
                ],
                addAttributes: ['target'],  // allow opening links in a new window
            },
        );

        if ('WIDGET' !== widgetEl.getHTMLElement().nodeName) {
            throw new Exception(`${widget.getWidgetDescriptorKey().toString()} is missing <widget> root element`);
        }

        return widgetEl;
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
