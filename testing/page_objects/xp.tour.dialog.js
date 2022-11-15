const Page = require('./page');
const appConst = require('../libs/app_const');

const xpath = {
    container: `//div[contains(@id,'ModalDialogWithConfirmation') and descendant::h2[contains(.,'Welcome Tour')]]`,
    skipTourButton: `//button[contains(@id,'DialogButton')]//span[contains(.,'Skip Tour')]`,
    nextButton: `//button[contains(@id,'DialogButton')]/span[text()='Next']`,
    previousButton: `//button[contains(@id,'DialogButton')]/span[text()='Previous']`,
    finishButton: "//button[contains(@id,'DialogButton')]/span[text()='Finish']",
    installAppsButton: `//button[contains(@id,'DialogButton')]/span[text()='Install Apps']`,
    title: "//h2[@class='title']",
    applicationStatusByName: name =>
        `//div[contains(@id,'enonic') and descendant::div[contains(@class,'demo-app-title') and contains(.,'${name}')]]//div[contains(@class,'demo-app-status')]`,
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

    get finishButton() {
        return xpath.container + xpath.finishButton;
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

    async waitForDialogLoaded() {
        try {
            await this.waitForElementDisplayed(xpath.container, appConst.longTimeout);
            return await this.pause(1000);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_xp_tour_dialog_load");
            await this.saveScreenshot(screenshot);
            throw new Error("XP tour dialog was not loaded, screenshot: " + screenshot + "  " + err);
        }
    }

    isDisplayed() {
        return this.isElementDisplayed(xpath.container);
    }

    clickOnInstallAppsButton() {
        return this.clickOnElement(this.installAppsButton);
    }

    async waitForInstallAppsButtonDisplayed() {
        try {
            let installButton = await this.findElement(this.installAppsButton);
            await installButton.waitForDisplayed({timeout: appConst.longTimeout});
            return await this.pause(1000);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_install_apps");
            await this.saveScreenshot(screenshot);
            throw new Error("Install Apps button is not visible, screenshot " + screenshot + " " + err)
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
    async goToInstallStep() {
        await this.clickOnNextButton();
        await this.pause(200);
        await this.clickOnNextButton();
        return await this.pause(400);
    }

    async waitForAppPresentInLauncherPanel(name) {
        try {
            let selector = xpath.applicationInLauncherPanel(name);
            return await this.waitForElementDisplayed(selector, appConst.shortTimeout);
        } catch (err) {
            let screenshot = appConst.generateRandomName("err_app_in_panel");
            await this.saveScreenshot(screenshot);
            throw new Error("Application is not present in Launcher Panel: " + screenshot + " " + err);
        }
    }

    async waitForAppFinishButtonVisible() {
        try {
            return await this.waitForElementDisplayed(this.finishButton, appConst.mediumTimeout);
        } catch (err) {
            await this.saveScreenshot('err_finish_button_launcher_panel');
            throw new Error("Finish button is not visible in the dialog: " + err);
        }
    }

    async waitForApplicationsStatus(appName) {
        try {
            let statusSelector = xpath.container + xpath.applicationStatusByName(appName) + "/span";
            let element = await this.findElement(statusSelector);
            await element.waitForDisplayed({timeout: appConst.INSTALL_APP_TIMEOUT});
            return await element.getText();
        } catch (err) {
            let screenshot = appConst.generateRandomName('err_app_status');
            await this.saveScreenshot(screenshot);
            throw new Error("XP Tour dialog - error when getting app status, screenshot: " + screenshot + "   " + err);
        }
    }

    async waitForApplicationInstalled(appName) {
        try {
            let statusSelector = xpath.container +
                                 `//div[contains(@id,'enonic') and descendant::div[contains(@class,'demo-app-title') and contains(.,'${appName}')]]`;
            await this.getBrowser().waitUntil(async () => {
                let result = await this.getAttribute(statusSelector, "class");
                return result.includes("installed");
            }, {timeout: appConst.INSTALL_APP_TIMEOUT, timeoutMsg: "Application should be installed"});
        } catch (err) {
            await this.saveScreenshot(appConst.generateRandomName('err_app_status'));
            throw new Error("XP Tour dialog - error when getting app status: " + err);
        }
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(xpath.container, appConst.shortTimeout);
    }

    getTitle() {
        return this.getText(xpath.title);
    }

    waitFoPreviousButtonDisplayed() {
        return this.waitForElementDisplayed(this.previousButton, appConst.mediumTimeout);
    }
}

module.exports = XpTourDialog;
