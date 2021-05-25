const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const testUtils = require('../libs/test.utils');
const HomePage = require('../page_objects/home.page');
const AboutDialog = require('../page_objects/about.dialog');

describe('Home Page specification - check buttons and open About dialog(licensing button)', function () {
    this.timeout(appConst.TIMEOUT_SUITE);
    webDriverHelper.setupBrowser();

    it('WHEN Home Page is loaded THEN expected buttons should be present in toolbar',
        async () => {
            let homePage = new HomePage();
            await homePage.waitForLoaded();
            let discuss = await homePage.isDiscussButtonDisplayed();
            assert.isTrue(discuss, "Discuss button should be displayed in the dashboard");
            let developer = await homePage.isDeveloperButtonDisplayed();
            assert.isTrue(developer, "Developer button should be displayed in the dashboard");
            let market = await homePage.isMarketButtonDisplayed();
            assert.isTrue(market, "Market button should be displayed in the dashboard");
        });

    it("GIVEN Home Page is loaded WHEN 'About' button has been clicked THEN About-dialog should appear AND 'Cancel-top' button closes the dialog",
        async () => {
            let homePage = new HomePage();
            let aboutDialog = new AboutDialog();
            await homePage.waitForLoaded();
            //1. Click on 'About' button:
            await homePage.clickOnAboutButton();
            await aboutDialog.waitForDialogLoaded();
            testUtils.saveScreenshot("about_dialog_opened");
            //2. Click on 'Cancel top' button
            await aboutDialog.clickOnCancelTopButton();
            await aboutDialog.waitForDialogClosed();
            testUtils.saveScreenshot("about_dialog_closed");
        });

    it("GIVEN 'About' dialog is opened WHEN 'Esc' button has been pressed THEN the modal dialog closes",
        async () => {
            let homePage = new HomePage();
            let aboutDialog = new AboutDialog();
            await homePage.waitForLoaded();
            //1. Click on 'About' button:
            await homePage.clickOnAboutButton();
            await aboutDialog.waitForDialogLoaded();
            //2. Click on 'Esc' key
            await aboutDialog.pressEscKey();
            testUtils.saveScreenshot("license_info_expanded");
            await aboutDialog.waitForDialogClosed();
        });

    it("GIVEN 'About' dialog is loaded WHEN Licensing button has been clicked THEN license-info should appear",
        async () => {
            let homePage = new HomePage();
            let aboutDialog = new AboutDialog();
            await homePage.waitForLoaded();
            //1. Click on About button:
            await homePage.clickOnAboutButton();
            await aboutDialog.waitForDialogLoaded();
            //2. Click on 'Licensing' button
            await aboutDialog.clickOnLicensingButton();
            testUtils.saveScreenshot("license_info_expanded");
            await aboutDialog.waitForLicenseBodyDisplayed();
            let text = await aboutDialog.getLicenseText();
            assert.isTrue(text.includes("Licenses used by Enonic XP (full license texts"));
        });

    it("GIVEN 'About' dialog is loaded AND Licensing button has been clicked WHEN click on Licensing button in the second time THEN license-info gets not visible",
        async () => {
            let homePage = new HomePage();
            let aboutDialog = new AboutDialog();
            await homePage.waitForLoaded();
            //1. Click on About button:
            await homePage.clickOnAboutButton();
            await aboutDialog.waitForDialogLoaded();
            //2. Click on 'Licensing' button and expand the info:
            await aboutDialog.clickOnLicensingButton();
            testUtils.saveScreenshot("license_info_expanded");
            await aboutDialog.waitForLicenseBodyDisplayed();
            //3. Click on 'Licensing' button and collapse the info:
            await aboutDialog.clickOnLicensingButton();
            testUtils.saveScreenshot("license_info_hidden");
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
