import {ApplicationJson} from '@enonic/lib-admin-ui/application/json/ApplicationJson';

export interface ApplicationInstallResultJson {

    applicationInstalledJson: ApplicationJson;

    failure: string;
}
