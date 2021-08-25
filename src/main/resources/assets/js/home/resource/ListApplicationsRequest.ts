import {ListApplicationsRequest as LibListAppsRequest} from 'lib-admin-ui/application/ListApplicationsRequest';
import {UrlHelper} from '../util/UrlHelper';

export class ListApplicationsRequest
    extends LibListAppsRequest {

    getPostfixUri(): string {
        return UrlHelper.getCmsRestUri('');
    }
}
