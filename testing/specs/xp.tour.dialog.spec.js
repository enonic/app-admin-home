const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const loginPage = require('../page_objects/login.page');
const appConst = require('../libs/app_const');
const testUtils = require('../libs/test.utils');
const xpTourDialog = require('../page_objects/xp.tour.dialog');

describe('XP tour dialog specification', function () {

    this.timeout(appConst.TIMEOUT_SUITE);
    var client = webDriverHelper.setupBrowser();

    it('WHEN user is logged in THEN XP tour dialog should appear', () => {
        this.bail(1);
        return loginPage.waitForPageLoaded(appConst.TIMEOUT_2).then(()=> {
            return loginPage.doLogin();
        }).then(()=> {
            return xpTourDialog.waitForDialogPresent();
        }).then(()=> {
            return xpTourDialog.isSkipTourButtonDisplayed();
        }).then(isVisible=> {
            assert.isTrue(isVisible, '`Skip tour` button should be present');
        }).then(()=> {
            return xpTourDialog.isCancelButtonTopDisplayed();
        }).then((isVisible)=> {
            assert.isTrue(isVisible, 'Cancel button should be present');
        }).then(()=> {
            return xpTourDialog.isNextButtonDisplayed();
        }).then((isVisible)=> {
            assert.isTrue(isVisible, '`Next` button should be displayed');
        }).then(()=> {
            return xpTourDialog.getTitle();
        }).then(title=> {
            assert.isTrue(title == 'Welcome Tour - Step 1 of 4', 'correct Dialog-title should be displayed');
        })
    });

    it('GIVEN XP tour dialog is opened WHEN `Skip Tour` button has been pressed THEN dialog should be closed', () => {

        return loginPage.waitForPageLoaded(appConst.DELETE_COOKIE_TIMEOUT).then(()=> {
            return loginPage.doLogin();
        }).then(()=> {
            return xpTourDialog.waitForDialogPresent();
        }).then(()=> {
            return xpTourDialog.clickOnSkipTourButton();
        }).then(()=> {
            return xpTourDialog.waitForDialogClosed();
        }).then((isClosed)=> {
            testUtils.saveScreenshot('xp_tour_skipped');
            assert.isTrue(isClosed, 'XP tour dialog must be closed');
        })
    });

    it('GIVEN XP tour dialog is opened WHEN `Cancel-top-button` has been pressed THEN dialog should be closed', () => {
        return loginPage.waitForPageLoaded(appConst.DELETE_COOKIE_TIMEOUT).then(()=> {
            return loginPage.doLogin();
        }).then(()=> {
            return xpTourDialog.waitForDialogPresent();
        }).then(()=> {
            return xpTourDialog.clickOnCancelButtonTop();
        }).then(()=> {
            return xpTourDialog.waitForDialogClosed();
        }).then((isClosed)=> {
            testUtils.saveScreenshot('xp_tour_canceled');
            assert.isTrue(isClosed, 'XP tour dialog must be closed');
        });
    });

    it('GIVEN XP tour dialog is opened WHEN Next-button has been pressed THEN Previous button should appear', () => {
        return loginPage.waitForPageLoaded(appConst.DELETE_COOKIE_TIMEOUT).then(()=> {
            return loginPage.doLogin();
        }).then(()=> {
            return xpTourDialog.waitForDialogPresent();
        }).then(()=> {
            return xpTourDialog.clickOnNextButton();
        }).then(()=> {
            return xpTourDialog.waitFoPreviousButtonDisplayed();
        }).then((isVisible)=> {
            testUtils.saveScreenshot('xp_tour_prev_button_should_be_visible');
            assert.isTrue(isVisible, 'Previous button should appear');
        }).then(()=> {
            return xpTourDialog.getTitle();
        }).then(title=> {
            assert.isTrue(title == 'Welcome Tour - Step 2 of 4', 'Dialog-title should be updated');
        })
    });

    afterEach(() => testUtils.doDeleteCookie());
    before(()=> {
        return console.log('specification starting: ' + this.title);
    });
});
