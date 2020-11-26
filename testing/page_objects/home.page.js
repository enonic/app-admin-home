/**
 * Created on 15/11/2019.
 */
const Page = require('./page');
const lib = require('../libs/elements');
const appConst = require('../libs/app_const');

const XPATH = {
    container: "//div[contains(@class,'home-main-container')]",
    dashboard: "//div[contains(@class,'center-panel')]",
    dashBoardItem: "//div[contains(@class,' dashboard-item')]",
    xpTourDialog: "//div[contains(@id,'ModalDialog') and descendant::h2[contains(.,'Welcome Tour')]]"
};

class HomePage extends Page {

    get closeXpTourButton() {
        return XPATH.xpTourDialog + lib.CANCEL_BUTTON_TOP;
    }

    get aboutButton() {
        return XPATH.container + XPATH.dashboard + XPATH.dashBoardItem + "//div[text()='About']"
    }

    get discussButton() {
        return XPATH.container + XPATH.dashboard + XPATH.dashBoardItem + "//div[text()='Discuss']"
    }

    get developerButton() {
        return XPATH.container + XPATH.dashboard + XPATH.dashBoardItem + "//div[text()='Developer']";
    }

    get marketButton() {
        return XPATH.container + XPATH.dashboard + XPATH.dashBoardItem + "//div[text()='Market']";
    }

    waitForLoaded() {
        return this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
    }

    async clickOnAboutButton() {
        await this.waitForElementDisplayed(this.aboutButton, appConst.shortTimeout);
        await this.clickOnElement(this.aboutButton);
        return await this.pause(200);
    }

    isDiscussButtonDisplayed() {
        return this.waitForElementDisplayed(this.discussButton, appConst.mediumTimeout);
    }

    isDeveloperButtonDisplayed() {
        return this.waitForElementDisplayed(this.developerButton, appConst.mediumTimeout);
    }

    isMarketButtonDisplayed() {
        return this.waitForElementDisplayed(this.marketButton, appConst.mediumTimeout);
    }
}

module.exports = HomePage;
