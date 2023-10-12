import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ResourceRequest as BaseResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {UrlHelper} from '../../util/UrlHelper';
import {WidgetDescriptorJson} from '@enonic/lib-admin-ui/content/json/WidgetDescriptorJson';
import {DashboardWidget} from './DashboardWidget';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';

export class ResourceRequest
    extends BaseResourceRequest<DashboardWidget[]> {

    getPostfixUri(): string {
        return UrlHelper.getCmsRestUri('');
    }

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('widget');
    }

    protected parseResponse(response: JsonResponse<WidgetDescriptorJson[]>): DashboardWidget[] {
        const json: WidgetDescriptorJson[] = response.getResult();
        return json.map((widgetDescriptorJson: WidgetDescriptorJson) => DashboardWidget.fromJson(widgetDescriptorJson));
    }
}
