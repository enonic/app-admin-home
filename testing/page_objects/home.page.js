/**
 * Created on 15/11/2019.
 */
const Page = require('./page');
const lib = require('../libs/elements');
const appConst = require('../libs/app_const');

const XPATH = {
    container: "//div[contains(@class,'home-main-container')]",
};

class HomePage extends Page {

    waitForLoaded() {
        return this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
    }

}

module.exports = HomePage;
