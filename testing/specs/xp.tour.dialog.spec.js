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

    it('WHEN user logged in THEN XP tour dialog should appear', () => {
        return loginPage.doLogin().then(()=> {
            return xpTourDialog.waitForVisible();
        }).then((isVisible)=> {
            testUtils.saveScreenshot("xp_tour_dialog_should_be_visible");
            assert.isTrue(isVisible, 'XP tour dialog mast be present');
        })
    });

    before(()=> {
        return console.log('specification starting: ' + this.title);
    });
});
