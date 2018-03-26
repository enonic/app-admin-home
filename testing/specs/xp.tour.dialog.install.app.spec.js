const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const loginPage = require('../page_objects/login.page');
const appConst = require('../libs/app_const');
const testUtils = require('../libs/test.utils');
const xpTourDialog = require('../page_objects/xp.tour.dialog');

describe('XP tour dialog - install applications', function () {

    this.timeout(appConst.TIMEOUT_SUITE);
    webDriverHelper.setupBrowser();

    it('GIVEN XP tour dialog is opened WHEN Next-button has been pressed 3 times THEN Install button should appear', () => {
        return loginPage.waitForPageLoaded(appConst.DELETE_COOKIE_TIMEOUT).then(()=> {
            return loginPage.doLogin();
        }).then(()=> {
            return xpTourDialog.waitForDialogPresent();
        }).then(()=> {
            return xpTourDialog.clickOnNextButton();
        }).then(()=> {
            return xpTourDialog.clickOnNextButton();
        }).then(()=> {
            return xpTourDialog.clickOnNextButton();
        }).then(()=> {
            return xpTourDialog.waitForInstallAppsButtonDisplayed();
        }).then((isVisible)=> {
            testUtils.saveScreenshot('xp_tour_install_button_should_be_visible');
            assert.isTrue(isVisible, 'Install Apps button should appear');
        }).then(()=> {
            return xpTourDialog.getNamesOfAvailableApplications();
        }).then(result=> {
            assert.isTrue(result.length == 3, 'Three applications should be available for installing');
        })
    });

    it('GIVEN fours step is opened WHEN `Install Apps` button has been pressed THEN three application should be installed', () => {
        return loginPage.waitForPageLoaded(appConst.DELETE_COOKIE_TIMEOUT).then(()=> {
            return loginPage.doLogin();
        }).then(()=> {
            return xpTourDialog.waitForDialogPresent();
        }).then(()=> {
            return xpTourDialog.goToFoursStep();
        }).then(()=> {
            return xpTourDialog.waitForInstallAppsButtonDisplayed();
        }).then(()=> {
            return xpTourDialog.clickOnInstallAppsButton();
        }).then(()=> {
            return xpTourDialog.waitForApplicationsStatus();
        }).then((result)=> {
            testUtils.saveScreenshot('xp_tour_apps_installed');
            assert.isTrue(result.length > 0, 'Status of applications should be `Installed`');
            assert.isTrue(result[0] == 'Installed', 'Status of applications should be `Installed`');
        })
    });
    afterEach(() => testUtils.doDeleteCookie());
    before(()=> {
        return console.log('specification starting: ' + this.title);
    });
});
