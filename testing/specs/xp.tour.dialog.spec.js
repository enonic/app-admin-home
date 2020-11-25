const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const LoginPage = require('../page_objects/login.page');
const appConst = require('../libs/app_const');
const testUtils = require('../libs/test.utils');
const XpTourDialog = require('../page_objects/xp.tour.dialog');

describe('XP tour dialog specification', function () {

    this.timeout(appConst.TIMEOUT_SUITE);
    webDriverHelper.setupBrowser();

    it('WHEN user is logged in THEN XP tour dialog should appear', async () => {
        const loginPage = new LoginPage();
        const xpTourDialog = new XpTourDialog();
        await loginPage.waitForPageLoaded(appConst.mediumTimeout);
        await loginPage.doLogin();
        //'XP tour' dialog must be loaded:
        await xpTourDialog.waitForDialogLoaded();
        let result = await xpTourDialog.isSkipTourButtonDisplayed();
        assert.isTrue(result, "Skip tour' button should be present");

        result = await xpTourDialog.isCancelButtonTopDisplayed();
        assert.isTrue(result, 'Cancel button should be present');

        result = await xpTourDialog.isNextButtonDisplayed();
        assert.isTrue(result, "'Next' button should be displayed");

        let title = await xpTourDialog.getTitle();
        assert.equal(title, 'Welcome Tour - Step 1 of 3', 'expected Dialog-title should be displayed');
    });

    it("GIVEN XP tour dialog is opened WHEN 'Skip Tour button has been pressed THEN dialog should be closed", async () => {
        const loginPage = new LoginPage();
        const xpTourDialog = new XpTourDialog();
        await loginPage.waitForPageLoaded(appConst.DELETE_COOKIE_TIMEOUT);
        await loginPage.doLogin();
        //1. modal dialog should be loaded automatically:
        await xpTourDialog.waitForDialogLoaded();
        //2. `Skip Tour` button has been pressed
        await xpTourDialog.clickOnSkipTourButton();
        testUtils.saveScreenshot('xp_tour_skipped');
        //3. 'XP tour dialog must be closed'
        await xpTourDialog.waitForDialogClosed();FFO
    });

    it('GIVEN XP tour dialog is opened WHEN `Cancel-top-button` has been pressed THEN dialog should be closed', async () => {
        const loginPage = new LoginPage();
        const xpTourDialog = new XpTourDialog();
        await loginPage.waitForPageLoaded(appConst.DELETE_COOKIE_TIMEOUT);
        await loginPage.doLogin();
        //1. modal dialog should be loaded automatically:
        await xpTourDialog.waitForDialogLoaded();
        //2. Cancel-top button has been clicked:
        await xpTourDialog.clickOnCancelButtonTop();
        testUtils.saveScreenshot('xp_tour_canceled');
        await xpTourDialog.waitForDialogClosed();
    });

    it('GIVEN XP tour dialog is opened WHEN Next-button has been pressed THEN Previous button should appear', async () => {
        const loginPage = new LoginPage();
        const xpTourDialog = new XpTourDialog();
        await loginPage.waitForPageLoaded(appConst.DELETE_COOKIE_TIMEOUT);
        await loginPage.doLogin();
        //1. modal dialog should be loaded automatically:
        await xpTourDialog.waitForDialogLoaded();
        //2. Click on Next button:
        await xpTourDialog.clickOnNextButton();
        //3. 'Previous' button should appear:
        await xpTourDialog.waitFoPreviousButtonDisplayed();
        //4. Dialog-title should be updated:
        let title = await xpTourDialog.getTitle();
        assert.equal(title, 'Welcome Tour - Step 2 of 3', 'Dialog-title should be updated after clicking on Next button');
    });

    afterEach(() => testUtils.doDeleteCookie());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
