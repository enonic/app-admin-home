const Page = require('./page');
const appConst = require('../libs/app_const');
const lib = require('../libs/elements');

const XPATH = {
    container: "//div[contains(@id,'ModalDialog') and contains(@class,'xp-about')]",
    licensingButton: "//button[contains(@id,'Button') and child::span[contains(.,'Licensing')]]",
    license: "//div[xp-about-dialog-license]",
    licenseHeader: "//div[contains(@class,'xp-license-info-header')]"
};

class AboutDialog extends Page {

    get licensingButton() {
        return XPATH.container + XPATH.licensingButton;
    }

    get cancelTopButton() {
        return XPATH.container + lib.CANCEL_BUTTON_TOP;
    }

    clickOnLicensingButton() {
        return this.clickOnElement(this.licensingButton);
    }

    clickOnCancelTopButton() {
        return this.clickOnElement(this.cancelTopButton);
    }

    async waitForDialogLoaded() {
        try {
            return await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
        } catch (err) {
            this.saveScreenshot("err_about_dialog_not_loaded");
            throw new Error("About dialog is not loaded in 3 seconds!")
        }
    }

    waitForLicenseBodyDisplayed() {
        return this.waitForElementDisplayed(XPATH.container + "//div[contains(@class,'xp-license-info-body')]");
    }

    getLicenseText() {
        return this.getText(XPATH.container + "//div[contains(@class,'xp-license-info-body')]");
    }

    waitForLicenseBodyNotDisplayed() {
        return this.waitForElementNotDisplayed(XPATH.container + "//div[contains(@class,'xp-license-info-body')]");
    }

    waitForDialogClosed() {
        return this.waitForElementNotDisplayed(XPATH.container, appConst.shortTimeout);
    }

    getTitle() {
        return this.getText(XPATH.container + "//h1");
    }
}

module.exports = AboutDialog;
