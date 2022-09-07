import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ResourceRequest as BaseResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {UrlHelper} from '../../util/UrlHelper';
import {WidgetDescriptorJson} from '@enonic/lib-admin-ui/content/json/WidgetDescriptorJson';
import {Widget} from '@enonic/lib-admin-ui/content/Widget';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';

export class ResourceRequest
    extends BaseResourceRequest<Widget[]> {

    getPostfixUri(): string {
        return UrlHelper.getCmsRestUri('');
    }

    constructor() {
        super();
        this.setMethod(HttpMethod.POST);
        this.addRequestPathElements('widget');
    }

    protected parseResponse(response: JsonResponse<WidgetDescriptorJson[]>): Widget[] {
        const json: WidgetDescriptorJson[] = response.getResult();
        return json.map((widgetDescriptorJson: WidgetDescriptorJson) => Widget.fromJson(widgetDescriptorJson));
    }
}
