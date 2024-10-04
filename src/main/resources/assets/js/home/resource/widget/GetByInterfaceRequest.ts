import {ResourceRequest as WidgetResourceRequest} from './ResourceRequest';

export class GetByInterfaceRequest
    extends WidgetResourceRequest {

    private readonly widgetInterface: string;

    constructor(widgetInterface: string) {
        super();
        this.widgetInterface = widgetInterface;
    }

    getParams(): object {
        return {
            widgetInterface: this.widgetInterface,
        };
    }
}
