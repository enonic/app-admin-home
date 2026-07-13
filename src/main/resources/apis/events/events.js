const websocketLib = require('/lib/xp/websocket');
const events = require('/lib/events');

const WS_PROTOCOL = 'json';

const APPLICATION_GROUP = 'application';

exports.get = function get(request) {
    if (!request.webSocket) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: 'Trying to access WebSocket with "webSocket" set to "false"'
        };
    }

    const headers = request.headers || {};
    const secWebSocketProtocol = headers['Sec-WebSocket-Protocol'];
    const protocols = secWebSocketProtocol ? secWebSocketProtocol.split(', ') : [];
    const isValidProtocol = protocols.some(protocol => protocol === WS_PROTOCOL);
    if (!isValidProtocol) {
        return {
            status: 400,
            contentType: 'text/plain',
            body: `Expected <${WS_PROTOCOL}>.`
        };
    }

    events.init();

    return {
        status: 101,
        webSocket: {
            subProtocols: [WS_PROTOCOL],
            data: {}
        }
    };
}

exports.webSocketEvent = function webSocketEvent(event) {
    try {
        switch (event.type) {
            case 'message':
                handleMessage(event);
                break;
            case 'error':
                log.error('events WS error message: ' + JSON.stringify(event.data));
                break;
            default:
                break;
        }
    } catch (e) {
        log.error('Error in webSocketEvent:', e);
    }
}

function handleMessage(event) {
    events.init();

    const socketId = event.session.id;
    const message = parseMessage(event.message);
    if (!message) {
        return;
    }

    switch (message.type) {
        case 'ping':
            websocketLib.send(socketId, JSON.stringify({type: 'pong'}));
            break;
        case 'connect':
            websocketLib.send(socketId, JSON.stringify({type: 'connected'}));
            break;
        case 'subscribe':
            websocketLib.addToGroup(APPLICATION_GROUP, socketId);
            break;
        default:
            break;
    }
}

function parseMessage(message) {
    try {
        return message != null ? JSON.parse(message) : undefined;
    } catch (e) {
        return undefined;
    }
}
