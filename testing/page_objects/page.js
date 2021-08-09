const webDriverHelper = require('../libs/WebDriverHelper');
const fs = require('fs');
const path = require('path');

class Page {
    constructor() {
        this.browser = webDriverHelper.browser;
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

    async saveScreenshot(name) {
        try {
            let screenshotsDir = path.join(__dirname, '/../build/mochawesome-report/screenshots/');
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir, { recursive: true });
            }
            await this.browser.saveScreenshot(screenshotsDir + name + '.png');
            console.log('screenshot is saved ' + name);
        } catch (err) {
            console.log('screenshot was not saved ' + err);
        }
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
}

module.exports = Page;
