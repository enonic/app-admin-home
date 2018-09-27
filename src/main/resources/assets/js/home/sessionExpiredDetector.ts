const statusUrl = CONFIG.adminUrl + '/rest/status';
const adminToolUrl = CONFIG.adminUrl + '/tool';
let connectionLostMessageId;

function doPoll() {
    const request = createGetStatusRequest();

    request.onreadystatechange = () => {
        if (request.readyState === 4) {
            if (request.status >= 200 && request.status < 300) {
                checkAuthenticated(request.response);
            } else {
                alertConnectionLost();
            }
        }
    };

    request.send();
}

function createGetStatusRequest() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', statusUrl, true);
    xhr.timeout = 10000;

    return xhr;
}

function checkAuthenticated(response) {
    const json = JSON.parse(response);
    const authenticated = json && json.context && json.context.authenticated;

    if (!authenticated) {
        logout();
    }
}

function logout() {
    window.location.href = adminToolUrl;
}

function alertConnectionLost() {
    if (!connectionLostMessageId) {
        connectionLostMessageId = api.notify.showError(
            api.util.i18n('notify.connection.loss')
        );
    }
}

export function startPolling() {
    setInterval(doPoll, 15000);
}
