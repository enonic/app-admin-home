import * as Q from 'q';
import {GetDashboardWidgetsRequest} from './resource/widget/GetDashboardWidgetsRequest';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {H5El} from '@enonic/lib-admin-ui/dom/H5El';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';

export class WidgetPanel
    extends DivEl {

    constructor() {
        super('widget-panel');
    }

    layout(): Q.Promise<boolean> {
        const deferred = Q.defer<boolean>();
        this.fetchWidgets()
            .then((widgetEls: Element[]) => {
                this.appendChildren(...widgetEls);
                deferred.resolve(widgetEls.length > 0);
            })
            .catch(() => deferred.reject());

        return deferred.promise;
    }

    private fetchWidgets(): Q.Promise<Element[]> {
        const deferred = Q.defer<Element[]>();

        new GetDashboardWidgetsRequest().fetchWidgets()
            .then((widgets: Widget[]) => {
                let baseUrl = document.location.href;
                if (!baseUrl.endsWith('/')) {
                    baseUrl += '/';
                }

                const fetchWidgetPromises = [];
                widgets.forEach((widget: Widget) => fetchWidgetPromises.push(this.fetchWidget(widget, baseUrl)));

                Q.all(fetchWidgetPromises)
                    .then((widgetElements: Element[]) => deferred.resolve(widgetElements))
                    .catch(DefaultErrorHandler.handle);
            })
            .catch(DefaultErrorHandler.handle);

        return deferred.promise;
    }

    private fetchWidget(widget: Widget, baseUrl: string): Q.Promise<Element> {
        const deferred = Q.defer<Element>();
        widgetEl.prependChild(new H5El('widget-header').setHtml(widget.getDisplayName()));
        fetch(baseUrl + widget.getUrl())
            .then(response => response.text())
            .then((html: string) => {
                const widgetWidthCls: string = widget.getConfig()['width'] || 'auto';
                const widgetEl: Element = Element.fromCustomarilySanitizedString(
                    html,
                    true,
                    {
                        addTags: [
                            'widget',
                            'link',
                        ],
                        addAttributes: ['target'],
                    },
                );
                widgetEl.setClass(widgetWidthCls);
                deferred.resolve(widgetEl);
            })
            .catch(DefaultErrorHandler.handle);

        return deferred.promise;
    }
}
