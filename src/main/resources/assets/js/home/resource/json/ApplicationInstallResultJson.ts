import {ApplicationJson} from 'lib-admin-ui/application/json/ApplicationJson';

export interface ApplicationInstallResultJson {

    applicationInstalledJson: ApplicationJson;

    failure: string;
}
