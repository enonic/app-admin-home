const Page = require('./page');
const appConst = require('../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'ModalDialog') and descendant::h2[contains(.,'Welcome Tour')]]`,
    skipTourButton: `//button[contains(@id,'DialogButton')]//span[contains(.,'Skip Tour')]`,
    nextButton: `//button[contains(@id,'DialogButton')]/span[text()='Next']`,
    previousButton: `//button[contains(@id,'DialogButton')]/span[text()='Previous']`,
    installAppsButton: `//button[contains(@id,'DialogButton')]/span[text()='Install Apps']`,
    title: `//h2[@class='title']`,
    applicationStatusByName: name =>
        `//div[@class='demo-app' and descendant::div[@class='demo-app-title' and contains(.,'${name}')]]//div[contains(@class,'demo-app-status')]`,
    applicationInLauncherPanel: name =>
        `//div[@class='launcher-app-container' and descendant::p[@class='app-name' and contains(.,'${name}')]]`,
};

class XpTourDialog extends Page {

    get nextButton() {
        return xpath.container + xpath.nextButton;
    }

    get installAppsButton() {
        return xpath.container + xpath.installAppsButton;
    }

    get previousButton() {
        return xpath.container + xpath.previousButton;
    }

    get skipTourButton() {
        return xpath.container + xpath.skipTourButton;
    }

    get cancelButtonTop() {
        return xpath.container + `//div[@class='cancel-button-top']`;
    }

    isCancelButtonTopDisplayed() {

        return this.isElementDisplayed(this.cancelButtonTop);
    }

    isNextButtonDisplayed() {
        return this.isElementDisplayed(this.nextButton);
    }

    isSkipTourButtonDisplayed() {
        return this.isElementDisplayed(this.skipTourButton);
    }

    clickOnNextButton() {
        return this.clickOnElement(this.nextButton);
    }

    clickOnSkipTourButton() {
        return this.clickOnElement(this.skipTourButton);
    }

    clickOnCancelButtonTop() {
        return this.clickOnElement(this.cancelButtonTop);
    }

    waitForDialogLoaded() {
        return this.browser.$(xpath.container).then(element => {
            return element.waitForDisplayed(3000);
        });
    }

    clickOnInstallAppsButton() {
        return this.clickOnElement(this.installAppsButton);
    }

    async waitForInstallAppsButtonDisplayed() {
        try {
            let installButton = await this.findElement(this.installAppsButton);
            return await installButton.waitForDisplayed(appConst.TIMEOUT_3);
        } catch (err) {
            this.saveScreenshot("err_xp_tour_install_button");
            throw new Error("Install Apps button is not visible in " + appConst.TIMEOUT_3 + " " + err)
        }
    }

    async getNamesOfAvailableApplications() {
        let strings = [];
        let elements = await this.findElements(`//div[@class='demo-apps']//div[@class='demo-app-title']`);
        elements.forEach(el => {
            strings.push(el.getText());
        });
        return Promise.all(strings);
    }

    //navigates to the last step (Install apps)
    goToInstallStep() {
        return this.clickOnNextButton().then(() => {
            return this.clickOnNextButton();
        }).then(() => {
            return this.pause(400);
        });
    }

    async waitForAppPresentInLauncherPanel(name) {
        try {
            let selector = xpath.applicationInLauncherPanel(name);
            let element = await this.findElement(selector);
            return await element.waitForDisplayed(appConst.TIMEOUT_2);
        } catch (err) {
            this.saveScreenshot('err_app_launcher_panel');
            throw new Error("Application is not present in Launcher Panel: " + err);
        }
    }

    async waitForApplicationsStatus(appName) {
        try {
            let statusSelector = xpath.applicationStatusByName(appName);
            let element = await this.findElement(statusSelector);
            await element.waitForDisplayed(appConst.INSTALL_APP_TIMEOUT);
            return await element.getText();
        } catch (err) {
            this.saveScreenshot('err_wait_app_status');
            throw new Error("XP Tour dialog - error when getting app status: " + err);
        }
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(`${xpath.container}`, appConst.TIMEOUT_1);
    }

    getTitle() {
        return this.getText(xpath.title);
    }

    waitFoPreviousButtonDisplayed() {
        return this.waitForElementDisplayed(this.previousButton, appConst.TIMEOUT_3);
    }
};
module.exports = XpTourDialog;



