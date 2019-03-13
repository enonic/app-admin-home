const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const loginPage = require('../page_objects/login.page');
const appConst = require('../libs/app_const');
const testUtils = require('../libs/test.utils');
const xpTourDialog = require('../page_objects/xp.tour.dialog');

describe('XP tour dialog - install applications and check their statuses', function () {

    this.timeout(appConst.TIMEOUT_SUITE);
    webDriverHelper.setupBrowser();

    it('GIVEN XP tour dialog is opened WHEN Next-button has been pressed 2 times THEN Install button should appear', () => {
        return loginPage.waitForPageLoaded(appConst.DELETE_COOKIE_TIMEOUT).then(() => {
            return loginPage.doLogin();
        }).then(() => {
            // XP Tour modal dialog should be loaded automatically
            return xpTourDialog.waitForDialogPresent();
        }).then(result => {
            testUtils.saveScreenshot("xp_tour_dialog_must_be_present2");
            assert.isTrue(result, 'XP tour dialog must be present!');
        }).then(() => {
            //Go to the step 2
            return xpTourDialog.clickOnNextButton();
        }).then(() => {
            // Go to the last step
            return xpTourDialog.clickOnNextButton();
        }).then(() => {
            return xpTourDialog.waitForInstallAppsButtonDisplayed();
        }).then(() => {
            testUtils.saveScreenshot('xp_tour_last_step');
            return xpTourDialog.getNamesOfAvailableApplications();
        }).then(result => {
            assert.isTrue(result.includes('LIVE TRACE'), 'Live trace app should be available');
            assert.isTrue(result.includes('CONTENT STUDIO'), 'Content Studio app should be available');
            assert.isTrue(result.includes('DATA TOOLBOX'), 'Data Toolbox app should be available');

            assert.isTrue(result.length == 3, 'Three applications should be available for installing');
        })
    });

    it('GIVEN Last step is opened WHEN `Install Apps` button has been pressed THEN three application should be installed', () => {
        return loginPage.waitForPageLoaded(appConst.DELETE_COOKIE_TIMEOUT).then(() => {
            return loginPage.doLogin();
        }).then(() => {
            return xpTourDialog.waitForDialogPresent();
        }).then(result => {
            testUtils.saveScreenshot("xp_tour_dialog_must_be_present3");
            assert.isTrue(result, 'XP tour dialog must be present!');
        }).then(() => {
            return xpTourDialog.goToInstallStep();
        }).then(() => {
            return xpTourDialog.waitForInstallAppsButtonDisplayed();
        }).then(() => {
            return xpTourDialog.clickOnInstallAppsButton();
        }).then(() => {
            return xpTourDialog.waitForApplicationsStatus('Content Studio');
        }).then(result => {
            testUtils.saveScreenshot('xp_tour_apps_installed');
            assert.isTrue(result === "Installed", "Installed status should be displayed")
        }).then(() => {
            return expect(xpTourDialog.waitForApplicationsStatus('Live Trace')).to.eventually.equal('Installed');
        }).then(() => {
            return expect(xpTourDialog.waitForApplicationsStatus('Data Toolbox')).to.eventually.equal('Installed');
        })
    });

    //verifies https://github.com/enonic/app-admin-home/issues/56
    //Welcome Tour dialog - unknown status of applications on the last step
    it('GIVEN XP tour dialog is opened WHEN last step has been opened THEN expected status of apps should be displayed AND applications should be present in Launcher Panel',
        () => {
            return loginPage.waitForPageLoaded(appConst.DELETE_COOKIE_TIMEOUT).then(() => {
                return loginPage.doLogin();
            }).then(() => {
                // XP Tour modal dialog should be loaded automatically
                return xpTourDialog.waitForDialogPresent();
            }).then(() => {
                //Go to the step 2
                return xpTourDialog.clickOnNextButton();
            }).then(() => {
                // Go to the last step
                return xpTourDialog.clickOnNextButton();
            }).then(() => {
                testUtils.saveScreenshot('xp_tour_issue_56');
                return expect(xpTourDialog.waitForApplicationsStatus('Content Studio')).to.eventually.equal('Installed');
            }).then(() => {
                //should be present in Launcher Panel
                return assert.eventually.isTrue(xpTourDialog.waitForAppPresentInLauncherPanel('Content Studio'),
                    '`Content Studio` should be present in Launcher Panel');
            })
        });
    beforeEach(() => testUtils.doDeleteCookie());
    afterEach(() => testUtils.doDeleteCookie());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
