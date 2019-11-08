import {startPolling} from './sessionExpiredDetector';
import {init} from './xptour';
import {i18nInit} from 'lib-admin-ui/util/MessagesInitializer';
import {ModalDialogWithConfirmation} from 'lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {CookieHelper} from 'lib-admin-ui/util/CookieHelper';
import {Application} from 'lib-admin-ui/app/Application';
import {ServerEventsListener} from 'lib-admin-ui/event/ServerEventsListener';
import {BodyMask} from 'lib-admin-ui/ui/mask/BodyMask';
import {Element} from 'lib-admin-ui/dom/Element';
import {i18n} from 'lib-admin-ui/util/Messages';
import {Body} from 'lib-admin-ui/dom/Body';

i18nInit(CONFIG.i18nUrl).then(() => {

    setupWebSocketListener();

    setupAboutDialog();

    startPolling();

    if (CONFIG.tourEnabled) {
        init().then(function (tourDialog: ModalDialogWithConfirmation) {
            const enonicXPTourCookie = CookieHelper.getCookie(
                'enonic_xp_tour'
            );
            if (!enonicXPTourCookie) {
                CookieHelper.setCookie('enonic_xp_tour', 'tour', 365);
                tourDialog.open();
            }

            document.querySelector('.xp-tour')
                .addEventListener('click', () => {
                    tourDialog.open();
                    setupBodyClickListeners(tourDialog);
                });
        });
    }
});

function setupWebSocketListener() {
    const dummyApp = new Application('home', 'home', 'home', '');
    dummyApp.setWindow(window);

    const serverEventsListener = new ServerEventsListener([dummyApp]);
    serverEventsListener.start();
}

function setupBodyClickListeners(dialog: ModalDialogWithConfirmation) {
    const bodyEl = BodyMask.get().getHTMLElement();

    function listener(e: MouseEvent) {
        e.stopPropagation();
        e.preventDefault();
        if (dialog.isVisible()) {
            dialog.close();
        }
        bodyEl.removeEventListener('click', listener);
    }
    bodyEl.addEventListener('click', listener);
}

function setupAboutDialog() {
    const aboutDialog = new ModalDialogWithConfirmation({skipTabbable: true});
    aboutDialog.addClass('xp-about-dialog');
    aboutDialog.appendChildToContentPanel(getAboutDialogContent());
    document.querySelector('.xp-about').addEventListener('click', () => {
        Body.get().appendChild(aboutDialog);
        aboutDialog.open();
        setupBodyClickListeners(aboutDialog);
    });
}

function getAboutDialogContent() {
    const html =
        '<div class="xp-about-dialog-content">' +
        '    <div class="xp-about-dialog-app-icon">' +
        '        <img src="' +
        CONFIG.assetsUri +
        '/icons/app-icon.svg">' +
        '    </div>' +
        '    <h1>Enonic XP</h1>' +
        '    <div class="xp-about-dialog-version-block">' +
        '        <span class="xp-about-dialog-version">' +
        CONFIG.xpVersion +
        '</span>&nbsp;&nbsp;' +
        '        <a href="https://developer.enonic.com/docs/xp/" target="_blank">' +
        i18n('home.dashboard.about.dialog.whatsnew') +
        '</a>' +
        '    </div>' +
        '    <div class="xp-about-dialog-text">' +
        i18n(
            'home.dashboard.about.dialog.text',
            '<span style="color: red;">♥</span>'
        ) +
        '    </div>' +
        '    <div class="xp-about-dialog-footer">' +
        '        <a href="https://github.com/enonic/xp/blob/master/LICENSE.txt" target="_blank">' +
        i18n('home.dashboard.about.dialog.licensing') +
        '</a>' +
        '        <a href="https://github.com/enonic/xp/" target="_blank">' +
        i18n('home.dashboard.about.dialog.sourcecode') +
        '</a>' +
        '        <a href="https://enonic.com/downloads" target="_blank">' +
        i18n('home.dashboard.about.dialog.downloads') +
        '</a>' +
        '    </div>' +
        '</div>';

    const element = Element.fromString(html);
    return element;
}
