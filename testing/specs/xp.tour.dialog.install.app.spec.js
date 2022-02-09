const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const LoginPage = require('../page_objects/login.page');
const appConst = require('../libs/app_const');
const testUtils = require('../libs/test.utils');
const XpTourDialog = require('../page_objects/xp.tour.dialog');

describe('XP tour dialog - install applications and check their statuses', function () {

    this.timeout(appConst.TIMEOUT_SUITE);
    webDriverHelper.setupBrowser();

    it('GIVEN XP tour dialog is opened WHEN Next-button has been pressed 2 times THEN Install button should appear', async function() {
        const loginPage = new LoginPage();
        const xpTourDialog = new XpTourDialog();
        await loginPage.waitForPageLoaded(appConst.DELETE_COOKIE_TIMEOUT);
        await loginPage.doLogin();
        testUtils.saveScreenshot("xp_tour_dialog_must_be_present2", this);
        //1. XP Tour modal dialog should be loaded automatically:
        await xpTourDialog.waitForDialogLoaded();
        //2. Go to the step 2:
        await xpTourDialog.clickOnNextButton();
        //3.  Go to the last step:
        await xpTourDialog.clickOnNextButton();
        await xpTourDialog.waitForInstallAppsButtonDisplayed();
        await testUtils.saveScreenshot('xp_tour_last_step', this);
        let result = await xpTourDialog.getNamesOfAvailableApplications();
        assert.isTrue(result.includes('LIVE TRACE'), 'Live trace app should be available');
        assert.isTrue(result.includes('CONTENT STUDIO'), 'Content Studio app should be available');
        assert.isTrue(result.includes('DATA TOOLBOX'), 'Data Toolbox app should be available');
        assert.equal(result.length, 3, 'Three applications should be available for installing');
    });

    it('GIVEN Last step is opened WHEN `Install Apps` button has been pressed THEN three application should be installed', async function() {
        const loginPage = new LoginPage();
        const xpTourDialog = new XpTourDialog();
        await loginPage.waitForPageLoaded(appConst.DELETE_COOKIE_TIMEOUT);
        await loginPage.doLogin();
        //1. 'XP tour' dialog must be loaded
        await xpTourDialog.waitForDialogLoaded();
        await testUtils.saveScreenshot("xp_tour_dialog_should_be_loaded", this);
        //2. Go to the last step:
        await xpTourDialog.goToInstallStep();
        await xpTourDialog.waitForInstallAppsButtonDisplayed();
        //3. Click on Install Apps button:
        await xpTourDialog.clickOnInstallAppsButton();
        await xpTourDialog.pause(4000);
        await testUtils.saveScreenshot('xp_tour_apps_installed', this);

        //'Live Trace' should be Installed
        //await xpTourDialog.waitForApplicationInstalled('Live Trace');
        //'Data Toolbox' should be Installed:
        //await xpTourDialog.waitForApplicationInstalled('Data Toolbox');
        //await xpTourDialog.waitForApplicationInstalled('Content Studio');
        // Finish button gets visible:
        await xpTourDialog.waitForAppFinishButtonVisible();
    });

    //verifies https://github.com/enonic/app-admin-home/issues/56
    //Welcome Tour dialog - unknown status of applications in the last step
    it('GIVEN XP tour dialog is opened WHEN last step has been opened THEN expected status of apps should be displayed AND applications should be present in Launcher Panel',
        async function() {
            const loginPage = new LoginPage();
            const xpTourDialog = new XpTourDialog();
            await loginPage.waitForPageLoaded(appConst.DELETE_COOKIE_TIMEOUT);
            await loginPage.doLogin();
            // XP Tour modal dialog should be loaded automatically
            await xpTourDialog.waitForDialogLoaded();
            //Go to the step 2
            await xpTourDialog.clickOnNextButton();
            // Go to the last step
            await xpTourDialog.clickOnNextButton();
            await testUtils.saveScreenshot('xp_tour_issue_56', this);
            //let status = await xpTourDialog.waitForApplicationsStatus('Content Studio');
            //assert.equal(status, "Installed", "Installed status should appear(Content Studio)");
            //'Content Studio' gets visible in Launcher Panel:
            await xpTourDialog.waitForAppPresentInLauncherPanel('Content Studio');
            await xpTourDialog.waitForAppPresentInLauncherPanel('Data toolbox');
            await xpTourDialog.waitForAppPresentInLauncherPanel('Live Trace');
        });

    beforeEach(() => testUtils.doDeleteCookie());
    afterEach(() => testUtils.doDeleteCookie());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
