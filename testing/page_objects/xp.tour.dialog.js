/**
 * Created  on 21/03/2018.
 */
const page = require('./page');
const appConst = require('../libs/app_const');
const xpath = {
    container: `//div[contains(@id,'ModalDialog') and descendant::h2[contains(.,'Welcome Tour')]]`,
    skipTourButton: `//button[contains(@id,'DialogButton')]/span[text()='Skip Tour']`,
    nextButtonButton: `//button[contains(@id,'DialogButton')]/span[text()='Next']`
};
var xpTourDialog = Object.create(page, {

    cancelButtonTop: {
        get: function () {
            return `${xpath.container}//div[@class='cancel-button-top']`
        }
    },
    skipTourButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.skipTourButton}`;
        }
    },
    clickOnCancelButtonTop: {
        value: function () {
            return this.doClick(this.cancelButtonTop);
        }
    },
    clickOnNextButton: {
        value: function () {
            return this.doClick(this.nextButtonButton);
        }
    },
    clickOnSkipTourButton: {
        value: function () {
            return this.doClick(this.skipTourButton);
        }
    },
    waitForVisible: {
        value: function () {
            return this.waitForVisible(`${xpath.container}`, appConst.TIMEOUT_2).catch(err=> {
                return false;
            })
        }
    },

    waitForDialogClosed: {
        value: function () {
            return this.waitForNotVisible(`${xpath.container}`, appConst.TIMEOUT_1);
        }
    },
});
module.exports = xpTourDialog;




