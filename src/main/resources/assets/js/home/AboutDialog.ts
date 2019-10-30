import Element = api.dom.Element;
import ModalDialog = api.ui.dialog.ModalDialog;

export const create = (): ModalDialog => {
    const aboutDialog = new ModalDialog({skipTabbable: true});
    const aboutDialogContent = getAboutDialogContent();
    aboutDialog.addClass('xp-about-dialog');
    aboutDialogContent.onAdded(() => {
        document.getElementById('xp-license-info-link').addEventListener(
            'click',
            (e: Event) => toggleLicenseInfo(e)
        );
    });

    aboutDialog.appendChildToContentPanel(aboutDialogContent);

    return aboutDialog;
};

/*
const fetchLicenses = () => {
    fetch()
};
*/


const appendLicenseInfo = () => {
    const container = Element.fromHtmlElement(document.querySelector('.xp-license-info-container'), true);
    if (container.getChildren().length) {
        return;
    }

    const licenseInfoHeader = new api.dom.DivEl('xp-license-info-header');
    licenseInfoHeader.setHtml('Enonic XP is licensed under Gnu Public License v3 (GPL3)');

    const licenseInfoBody = new api.dom.DivEl('xp-license-info-body');
    licenseInfoBody.setHtml('Fetched license info here...');

    container.appendChildren(licenseInfoHeader, licenseInfoBody);
};


const toggleLicenseInfo = (e: Event) => {
    const container = Element.fromHtmlElement(document.querySelector('.xp-about-dialog-license'));

    appendLicenseInfo();

    container.toggleClass('expanded');

    e.stopPropagation();
    e.preventDefault();
};

const getAboutDialogContent = () => {
    const i18n = api.util.i18n;

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
        '    <div class="xp-about-dialog-license">' +
        '       <a id="xp-license-info-link" href="#">' +
        i18n('home.dashboard.about.dialog.licensing') +
        '       </a>' +
        '       <div class="xp-license-info-container"></div>' +
        '    </div>' +
        '</div>';

    const element = api.dom.Element.fromString(html);
    return element;
};
