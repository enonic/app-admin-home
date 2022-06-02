import {ListApplicationsRequest as LibListAppsRequest} from '@enonic/lib-admin-ui/application/ListApplicationsRequest';
import {UrlHelper} from '../util/UrlHelper';

export class ListApplicationsRequest
    extends LibListAppsRequest {

    getPostfixUri(): string {
        return UrlHelper.getCmsRestUri('');
    }
}
