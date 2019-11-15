import {i18n} from 'lib-admin-ui/util/Messages';
import {showError} from 'lib-admin-ui/notify/MessageBus';

let connectionLostMessageId;

function doPoll(config: GlobalConfig) {
    const {adminUrl} = config;
    const statusUrl = `${adminUrl}/rest/status`;
    const logoutUrl = `${adminUrl}/tool`;

    const request = createGetStatusRequest(statusUrl);

    request.onreadystatechange = () => {
        if (request.readyState === 4) {
            if (request.status >= 200 && request.status < 300) {
                checkAuthenticated(request.response, logoutUrl);
            } else {
                alertConnectionLost();
            }
        }
    };

    request.send();
}

function createGetStatusRequest(statusUrl: string) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', statusUrl, true);
    xhr.timeout = 10000;

    return xhr;
}

function checkAuthenticated(response: any, logoutUrl: string) {
    const json = JSON.parse(response);
    const authenticated = json && json.context && json.context.authenticated;

    if (!authenticated) {
        logout(logoutUrl);
    }
}

function logout(logoutUrl: string) {
    window.location.href = logoutUrl;
}

function alertConnectionLost() {
    if (!connectionLostMessageId) {
        connectionLostMessageId = showError(
            i18n('notify.connection.loss')
        );
    }
}

export function startPolling(config: GlobalConfig) {
    setInterval(() => doPoll(config), 15000);
}
