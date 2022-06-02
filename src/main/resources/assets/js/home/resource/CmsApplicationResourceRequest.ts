import {ResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {UrlHelper} from '../util/UrlHelper';
import {ApplicationJson} from '@enonic/lib-admin-ui/application/json/ApplicationJson';
import {Application} from '@enonic/lib-admin-ui/application/Application';

export class CmsApplicationResourceRequest<PARSED_TYPE>
    extends ResourceRequest<PARSED_TYPE> {

    getPostfixUri(): string {
        return UrlHelper.getCmsRestUri('');
    }

    constructor() {
        super();
        this.addRequestPathElements('application');
    }

    fromJsonToApplication(json: ApplicationJson): Application {
        return Application.fromJson(json);
    }
}
