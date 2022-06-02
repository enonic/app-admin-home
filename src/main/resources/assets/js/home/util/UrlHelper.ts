import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';

export class UrlHelper {

    static getCmsRestUri(path: string): string {
        return UriHelper.getAdminUri(UriHelper.joinPath('rest-v2', 'main', UriHelper.relativePath(path)));
    }
}
