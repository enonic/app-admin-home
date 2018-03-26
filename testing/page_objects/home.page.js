/**
 * Created on 6/19/2017.
 */

const page = require('./page');
const xpTourDialog = {
    container: `//div[contains(@id,'ModalDialog') and descendant::h2[contains(.,'Welcome Tour')]]`
};
const home = {
    container: `div[class*='home-main-container']`
};
var homePage = Object.create(page, {

    closeXpTourButton: {
        get: function () {
            return `${xpTourDialog.container}//div[@class='cancel-button-top']`
        }
    },
    waitForXpTourVisible: {
        value: function (ms) {
            return this.waitForVisible(`${xpTourDialog.container}`, ms).catch(err=> {
                return false;
            })
        }
    },
    waitForLoaded: {
        value: function (ms) {
            return this.waitForVisible(`${home.container}`, ms);
        }
    },
    doCloseXpTourDialog: {
        value: function () {
            return this.doClick(this.closeXpTourButton).catch(err=> {
                this.saveScreenshot("err_close_xp_tour");
                throw new Error("err when close the XpTour dialog " + err);
            })
        }
    },
});
module.exports = homePage;
