const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const testUtils = require('../libs/test.utils');
const HomePage = require('../page_objects/home.page');
const AboutDialog = require('../page_objects/about.dialog');
const ShortcutsWidget = require('../page_objects/shortcuts.widget');

describe('Home Page, Shortcut widget specification - check widget items and open About dialog(licensing button)', function () {
    this.timeout(appConst.TIMEOUT_SUITE);
    webDriverHelper.setupBrowser();
    const WIDGET_SHORTCUTS_HEADER = 'Useful Links';

    it('WHEN Home Page is loaded THEN expected buttons should be present in toolbar',
        async function () {
            let homePage = new HomePage();
            let shortcutsWidget = new ShortcutsWidget();
            await homePage.waitForLoaded();
            let actualHeader = await shortcutsWidget.getWidgetShortcutHeader();
            assert.equal(actualHeader, WIDGET_SHORTCUTS_HEADER, "'Useful Links' header should be displayed");

            // XP tour button should be displayed in the widget
            await shortcutsWidget.waitForXpTourItemDisplayed();
            // About button should be displayed in the widget
            await shortcutsWidget.waitForAboutItemDisplayed();
            // Developer button should be displayed in the widget
            await shortcutsWidget.waitForDeveloperItemDisplayed();
            // Discuss button should be displayed in the widget
            await shortcutsWidget.waitForDiscussItemDisplayed();
            // Market button should be displayed in the widget
            await shortcutsWidget.waitForMarketItemDisplayed();
            // Slack button should be displayed in the widget
            await shortcutsWidget.waitForSlackItemDisplayed();
        });

    it("GIVEN Home Page is loaded WHEN 'About' button has been clicked in the widget THEN About-dialog should appear AND 'Cancel-top' button closes the dialog",
        async function () {
            let homePage = new HomePage();
            let shortcutsWidget = new ShortcutsWidget();
            let aboutDialog = new AboutDialog();
            await homePage.waitForLoaded();
            await testUtils.saveScreenshot('about_dialog_test1');
            // 1. Click on 'About' button:
            await shortcutsWidget.clickOnAboutButton();
            await testUtils.saveScreenshot('about_dialog_opened');
            await aboutDialog.waitForDialogLoaded();
            // 2. Click on 'Cancel top' button
            await aboutDialog.clickOnCancelTopButton();
            await aboutDialog.waitForDialogClosed();
        });

    it("GIVEN 'About' dialog is opened WHEN 'Esc' button has been pressed THEN the modal dialog closes",
        async function () {
            let homePage = new HomePage();
            let shortcutsWidget = new ShortcutsWidget();
            let aboutDialog = new AboutDialog();
            await homePage.waitForLoaded();
            // 1. Click on 'About' button:
            await shortcutsWidget.clickOnAboutButton();
            await testUtils.saveScreenshot('about_dialog_opened3');
            await aboutDialog.waitForDialogLoaded();
            // 2. Click on 'Esc' key
            await aboutDialog.pressEscKey();
            await aboutDialog.waitForDialogClosed();
        });

    it("GIVEN 'About' dialog is loaded WHEN Licensing button has been clicked THEN license-info should appear",
        async function () {
            let homePage = new HomePage();
            let shortcutsWidget = new ShortcutsWidget();
            let aboutDialog = new AboutDialog();
            await homePage.waitForLoaded();
            // 1. Click on About button:
            await shortcutsWidget.clickOnAboutButton();
            await aboutDialog.waitForDialogLoaded();
            // 2. Click on 'Licensing' button
            await aboutDialog.clickOnLicensingButton();
            await testUtils.saveScreenshot('license_info_expanded', this);
            await aboutDialog.waitForLicenseBodyDisplayed();
            let text = await aboutDialog.getLicenseText();
            assert.isTrue(text.includes('Licenses used by Enonic XP (full license texts'));
        });

    it("GIVEN License info is expanded WHEN Licensing button has been clicked THEN license-info gets not visible",
        async function () {
            let homePage = new HomePage();
            let aboutDialog = new AboutDialog();
            let shortcutsWidget = new ShortcutsWidget();
            await homePage.waitForLoaded();
            // 1. Click on About button:
            await shortcutsWidget.clickOnAboutButton();
            await aboutDialog.waitForDialogLoaded();
            // 2. Click on 'Licensing' button and expand the info:
            await aboutDialog.clickOnLicensingButton();
            await testUtils.saveScreenshot('license_info_expanded', this);
            await aboutDialog.waitForLicenseBodyDisplayed();
            // 3. Click on 'Licensing' button and collapse the info:
            await aboutDialog.clickOnLicensingButton();
            await testUtils.saveScreenshot('license_info_hidden', this);
            await aboutDialog.waitForLicenseBodyNotDisplayed();
        });

    beforeEach(async () => {
        await testUtils.doDeleteCookie();
        return await testUtils.doLoginAndCloseXpTourDialog();
    });

    afterEach(() => testUtils.doDeleteCookie());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
