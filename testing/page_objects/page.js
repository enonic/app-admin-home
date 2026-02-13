const webDriverHelper = require('../libs/WebDriverHelper');
const fs = require('fs');
const path = require('path');
const appConst = require("../libs/app_const");

class Page {

    constructor() {
        if (typeof browser !== 'undefined') {
            this.browser = browser;
        } else {
            this.browser = webDriverHelper.browser;
        }
    }

    getBrowser() {
        return this.browser;
    }

    findElement(selector) {
        return this.browser.$(selector);
    }

    findElements(selector) {
        return this.browser.$$(selector);
    }

    keys(value) {
        return this.browser.keys(value);
    }
    pause(ms) {
        return this.browser.pause(ms);
    }

    async clickOnElement(selector) {
        let element = await this.findElement(selector);
        await element.waitForDisplayed({timeout: 1000});
        return await element.click();
    }

    async getText(selector) {
        let element = await this.findElement(selector);
        return await element.getText();
    }

    async handleError(errorMessage, screenshotName, error) {
        if (Error.prototype.hasOwnProperty('cause')) {
            throw new Error(`${errorMessage}: ${error.message}  [screenshot]: ${screenshotName} `, {cause: error});
        }
        const wrapped = new Error(`${errorMessage}: ${error.message} `);
        wrapped.cause = error;
        wrapped.screenshotTaken = error.screenshotTaken;
        wrapped.screenshotName = error.screenshotName;

        if (!wrapped.screenshotTaken) {
            wrapped.screenshotName = screenshotName
            wrapped.screenshotTaken = true;
            wrapped.message += `[Screenshot]: ${screenshotName}`
            await this.saveScreenshotUniqueName(wrapped.screenshotName);
        }
        throw wrapped;
    }

    async saveScreenshot(name) {
        try {
            let screenshotsDir = path.join(__dirname, '/../build/reports/screenshots/');
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir, { recursive: true });
            }
            await this.getBrowser().saveScreenshot(screenshotsDir + name + '.png');
            console.log('screenshot is saved ' + name);
        } catch (err) {
            console.log('screenshot was not saved ' + err);
        }
    }
    async saveScreenshotUniqueName(namePart) {
        let screenshotName = appConst.generateRandomName(namePart);
        await this.saveScreenshot(screenshotName);
        return screenshotName;
    }

    async isElementDisplayed(selector) {
        let element = await this.findElement(selector);
        return element.isDisplayed();
    }

    async waitForElementNotDisplayed(selector, ms) {
        let element = await this.findElement(selector);
        return element.waitForDisplayed({timeout: ms, reverse: true});
    }

    async waitForElementDisplayed(selector, ms) {
        let element = await this.findElement(selector);
        return element.waitForDisplayed({timeout: ms});
    }

    async pressEscKey() {
        await this.keys('Escape');
        return await this.pause(500);
    }
    getBrowser() {
        return this.browser;
    }
    async getAttribute(selector, attributeName) {
        let element = await this.findElement(selector);
        return await element.getAttribute(attributeName);
    }
}

module.exports = Page;
