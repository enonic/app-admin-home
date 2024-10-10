import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ModalDialogWithConfirmation} from '@enonic/lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {KeyHelper} from '@enonic/lib-admin-ui/ui/KeyHelper';
import {LocalI18nManager} from '../LocalI18nManager';

const noticeUrl = 'https://raw.githubusercontent.com/enonic/xp/master/NOTICE.txt';
const licenseUrl = 'https://raw.githubusercontent.com/enonic/xp/master/LICENSE.txt';

let i18nManager: LocalI18nManager;

const getAboutDialogContent = (): Element => {
    const html = `
        <div class="xp-about-dialog-content">
            <div class="xp-about-dialog-app-icon">
                <img src="${CONFIG.getString('assetsUri')}/icons/app-icon.svg">
            </div>
            <h1>Enonic XP</h1>
            <div class="xp-about-dialog-version-block">
                <span class="xp-about-dialog-version">${CONFIG.getString('xpVersion')}</span>&nbsp;&nbsp;
                <a href="https://developer.enonic.com/docs/xp/stable/release" target="_blank">
                    ${i18nManager.i18n('home.dashboard.about.dialog.whatsnew')}?
                </a>
            </div>
            <div class="xp-about-dialog-text">
                ${i18nManager.i18n(
        'home.dashboard.about.dialog.text',
        '<span style="color: red;">♥</span>',
    )}
            </div>
            <div class="xp-about-dialog-license"></div>
        </div>`;

    return Element.fromCustomarilySanitizedString(
        html,
        true,
        {
            addAttributes: ['target'],  // allow opening links in a new window
        },
    );
};

const fetchLicenses = (): Promise<string> => {
    return fetch(noticeUrl)
        .then((response: Response) => response.text())
        .catch(() => {
            return i18nManager.i18n('home.dashboard.about.dialog.license.error');
        });
};

const toggleLicenseInfo = (outerContainer: Element, licenseInfoContainer: DivEl): void => {
    if (licenseInfoContainer.getHtml() !== '') {
        outerContainer.toggleClass('expanded');
        return;
    }

    void fetchLicenses().then((licenseText: string) => {
        licenseInfoContainer.setHtml(licenseText);

        outerContainer.toggleClass('expanded');
    });
};

const createLicenseInfoContainer = (): void => {
    const outerContainer = Element.fromHtmlElement(document.querySelector('.xp-about-dialog-license'), true);

    if (outerContainer.getChildren().length) {
        return;
    }

    const button = new Button(i18nManager.i18n('home.dashboard.about.dialog.licensing'));
    const linkEl = new AEl();
    linkEl.setUrl(licenseUrl);
    linkEl.getEl().setText('Gnu Public License v3 (GPL3)');
    linkEl.getEl().setAttribute('target', '_blank');

    const licenseInfoHeader = new DivEl('xp-license-info-header');
    licenseInfoHeader.setHtml(i18nManager.i18n('home.dashboard.about.dialog.license.title'));
    licenseInfoHeader.appendChild(linkEl);

    const licenseInfoContainer = new DivEl('xp-license-info-body');

    button.onClicked(() => toggleLicenseInfo(outerContainer, licenseInfoContainer));

    outerContainer.appendChildren(button, licenseInfoHeader, licenseInfoContainer);
};

export const createAboutDialog = (): ModalDialogWithConfirmation => {
    i18nManager = new LocalI18nManager(CONFIG.getString('phrases'));

    const aboutDialog: ModalDialogWithConfirmation = new ModalDialogWithConfirmation({skipTabbable: true});

    aboutDialog.onKeyDown((event: KeyboardEvent) => {
        if (KeyHelper.isEscKey(event)) {
            aboutDialog.close();
        }
    });

    const aboutDialogContent = getAboutDialogContent();
    aboutDialog.addClass('xp-about-dialog');
    aboutDialogContent.onAdded(createLicenseInfoContainer);
    aboutDialog.appendChildToContentPanel(aboutDialogContent);

    return aboutDialog;
};
