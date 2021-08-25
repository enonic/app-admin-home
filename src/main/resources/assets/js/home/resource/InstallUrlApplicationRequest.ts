import {CmsApplicationResourceRequest} from './CmsApplicationResourceRequest';
import {ApplicationInstallResult} from './ApplicationInstallResult';
import {ApplicationInstallResultJson} from './json/ApplicationInstallResultJson';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';


export class InstallUrlApplicationRequest
    extends CmsApplicationResourceRequest<ApplicationInstallResult> {

    private applicationUrl: string;

    constructor(applicationUrl: string) {
        super();
        this.setMethod(HttpMethod.POST);
        this.applicationUrl = applicationUrl;
        this.setHeavyOperation(true);
        this.addRequestPathElements('installUrl');
    }

    getParams(): Record<string, unknown> {
        return {
            URL: this.applicationUrl,
        };
    }

    protected parseResponse(response: JsonResponse<ApplicationInstallResultJson>): ApplicationInstallResult {
        return ApplicationInstallResult.fromJson(response.getResult());
    }
}
