import {ResourceRequest as WidgetResourceRequest} from './ResourceRequest';

export class GetByInterfaceRequest
    extends WidgetResourceRequest {

    private readonly widgetInterfaces: string[];

    constructor(widgetInterfaces: string[]) {
        super();
        this.widgetInterfaces = widgetInterfaces;
        this.addRequestPathElements('list', 'byinterfaces');
    }

    getParams(): string[] {
        return this.widgetInterfaces;
    }
}
