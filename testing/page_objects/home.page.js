/**
 * Created on 15/11/2019.
 */
const Page = require('./page');
const appConst = require('../libs/app_const');

const XPATH = {
    container: "//div[contains(@class,'home-main-container')]",
};

class HomePage extends Page {

    async waitForLoaded() {
        try {
             await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
             await this.pause(1000);
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_home_page');
            throw new Error("Home Page should be loaded! screenshot:" + screenshot + ' ' + err);
        }
    }
}

module.exports = HomePage;
