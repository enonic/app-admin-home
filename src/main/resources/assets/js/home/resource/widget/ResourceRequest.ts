import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ResourceRequest as BaseResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {WidgetDescriptorJson} from '@enonic/lib-admin-ui/content/json/WidgetDescriptorJson';
import {DashboardWidget} from './DashboardWidget';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';

export class ResourceRequest
    extends BaseResourceRequest<DashboardWidget[]> {

    getPostfixUri(): string {
        return CONFIG.getString('widgetApiUrl');
    }

    constructor() {
        super();
        this.setMethod(HttpMethod.GET);
    }

    protected parseResponse(response: JsonResponse<WidgetDescriptorJson[]>): DashboardWidget[] {
        const json: WidgetDescriptorJson[] = response.getResult();
        return json.map((widgetDescriptorJson: WidgetDescriptorJson) => DashboardWidget.fromJson(widgetDescriptorJson));
    }
}
