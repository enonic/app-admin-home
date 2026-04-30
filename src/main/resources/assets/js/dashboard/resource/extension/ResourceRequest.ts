import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {ResourceRequest as BaseResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {ExtensionDescriptorJson} from '@enonic/lib-admin-ui/extension/ExtensionDescriptorJson';
import {DashboardExtension} from './DashboardExtension';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';

export class ResourceRequest
    extends BaseResourceRequest<DashboardExtension[]> {

    getPostfixUri(): string {
        return CONFIG.getString('extensionApiUrl');
    }

    constructor() {
        super();
        this.setMethod(HttpMethod.GET);
    }

    protected parseResponse(response: JsonResponse<ExtensionDescriptorJson[]>): DashboardExtension[] {
        const json: ExtensionDescriptorJson[] = response.getResult();
        return json.map((descriptorJson: ExtensionDescriptorJson) => DashboardExtension.fromJson(descriptorJson));
    }
}
