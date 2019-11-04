import Element = api.dom.Element;
import DivEl = api.dom.DivEl;
import ModalDialog = api.ui.dialog.ModalDialog;
import i18n = api.util.i18n;

const licenseUrl: string = 'https://raw.githubusercontent.com/enonic/xp/master/NOTICE.txt';

export const create = (): ModalDialog => {
    const aboutDialog = new ModalDialog({skipTabbable: true});
    const aboutDialogContent = getAboutDialogContent();
    aboutDialog.addClass('xp-about-dialog');
    aboutDialogContent.onAdded(() => {
        createLicenseInfoContainer();
    });

    aboutDialog.appendChildToContentPanel(aboutDialogContent);

    return aboutDialog;
};


const fetchLicenses = (): Promise<string> => {
    return fetch(licenseUrl)
        .then(response => response.text())
        .catch(() => {
            return 'Failed to fetch license info';
        });
};


const createLicenseInfoContainer = () => {
    const outerContainer = Element.fromHtmlElement(document.querySelector('.xp-about-dialog-license'));
    const button = new api.ui.button.Button(i18n('home.dashboard.about.dialog.licensing'));

    const licenseInfoHeader = new DivEl('xp-license-info-header');
    licenseInfoHeader.setHtml(i18n('home.dashboard.about.dialog.licensing.title'));

    const licenseInfoContainer = new DivEl('xp-license-info-body');
    //licenseInfoBody.setHtml('Fetched license info here...');

    button.onClicked((e: MouseEvent) => toggleLicenseInfo(e, outerContainer, licenseInfoContainer));

    outerContainer.appendChildren(button, licenseInfoHeader, licenseInfoContainer);
};

const toggleLicenseInfo = (e: MouseEvent, outerContainer: Element, licenseInfoContainer: DivEl) => {
    if (!licenseInfoContainer.getHtml()) {

        fetchLicenses().then((licenseText: string) => {
            licenseInfoContainer.setHtml(licenseText);

            outerContainer.toggleClass('expanded');
        });

        return;
    }

    outerContainer.toggleClass('expanded');
};

const getAboutDialogContent = () => {
    const html = `
        <div class="xp-about-dialog-content">
            <div class="xp-about-dialog-app-icon">
                <img src="${CONFIG.assetsUri}/icons/app-icon.svg">
            </div>
            <h1>Enonic XP</h1>
            <div class="xp-about-dialog-version-block">
                <span class="xp-about-dialog-version">${CONFIG.xpVersion}</span>&nbsp;&nbsp;
                <a href="https://developer.enonic.com/docs/xp/" target="_blank">
                    ${i18n('home.dashboard.about.dialog.whatsnew')}
                </a>
            </div>
            <div class="xp-about-dialog-text">
                ${i18n(
                    'home.dashboard.about.dialog.text',
                    '<span style="color: red;">♥</span>'
                )}
            </div>
            <div class="xp-about-dialog-license"></div>
        </div>`;

    const element = api.dom.Element.fromString(html);
    return element;
};
