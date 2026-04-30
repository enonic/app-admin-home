import {ResourceRequest as WidgetResourceRequest} from './ResourceRequest';

export class GetByInterfaceRequest
    extends WidgetResourceRequest {

    private readonly extensionInterface: string;

    constructor(widgetInterface: string) {
        super();
        this.extensionInterface = widgetInterface;
    }

    getParams(): object {
        return {
            'interface': this.extensionInterface,
        };
    }
}
