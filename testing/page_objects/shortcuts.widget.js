const Page = require('./page');
const appConst = require('../libs/app_const');


const locators = {
    extensionHostElement: 'dashboard-extension',
    container: "//div[contains(@id,'DashboardPanel')]",
    widgetShortcutsDiv: "//div[contains(@class,'extension-container')]",
    shortcutItemNameDiv: "//div[contains(@class,'extension-shortcuts-item')]/a/div",
    aboutDivItem: "div.shortcuts-item:has(div*=About)",
    developerDivItem: "//div[contains(@class,'shortcuts-item') and descendant::div[text()='Developer']]",
    discussDivItem: "//div[contains(@class,'shortcuts-item') and descendant::div[text()='Discuss']]",
    marketDivItem: "//div[contains(@class,'shortcuts-item') and descendant::div[text()='Market']]",
    slackDivItem: "//div[contains(@class,'shortcuts-item') and descendant::div[text()='Slack']]",
};

class ShortcutsWidget extends Page {

    get aboutItem() {
        return locators.container + locators.aboutDivItem;
    }

    get developerItem() {
        return locators.container + locators.developerDivItem;
    }

    get marketItem() {
        return locators.container + locators.marketDivItem;
    }

    get slackItem() {
        return locators.container + locators.slackDivItem;
    }

    get discussItem() {
        return locators.container + locators.discussDivItem;
    }

    async clickOnAboutButton() {
        try {
            await this.waitForAboutItemDisplayed();
            await this.clickOnElement(this.aboutItem);
            return await this.pause(1000);
        } catch (err) {
            await this.handleError(`Shortcuts Widget, error during clicking on About widget item`, 'err_about_btn', err);
        }
    }

    async waitForWidgetLoaded() {
        try {
            return await this.waitForElementDisplayed(locators.container, appConst.mediumTimeout);
        } catch (err) {
            await this.handleError(`Shortcuts Widget is not loaded`, 'err_widget_load', err);
        }
    }

    waitForDiscussItemDisplayed() {
        return this.waitForElementDisplayed(this.discussItem);
    }

    waitForDeveloperItemDisplayed() {
        return this.waitForElementDisplayed(this.developerItem);
    }

    waitForMarketItemDisplayed() {
        return this.waitForElementDisplayed(this.marketItem);
    }

    waitForSlackItemDisplayed() {
        return this.waitForElementDisplayed(this.slackItem);
    }

    async waitForAboutItemDisplayed() {
        try {
            const items = await this.getBrowser().$('dashboard-extension').shadow$$('a > div');
            for (const item of items) {
                const text = await item.getText();
                if (text.includes('About')) {
                    await item.waitForDisplayed({
                        timeout: appConst.mediumTimeout,
                        timeoutMsg: 'About item should be displayed in shortcuts widget'
                    });
                    return item;
                }
            }
            throw new Error('About item not found in shortcuts widget');
        } catch (err) {
            await this.handleError('About item is not displayed', 'err_about_item', err);
        }
    }


    async waitForAboutItemDisplayed2() {
        let el = await this.getShadowElement(locators.extensionHostElement,locators.aboutDivItem);
        return await el.waitForDisplayed({timeout: ms},{timeoutMsg: `About item should be displayed in shortcuts widget`});
    }

    async getWidgetShortcutItems() {
        try {
            const host = await this.findElement('dashboard-extension');
            const divs = await host.shadow$$('a > div');

            for (const div of divs) {
                console.log(await div.getText())
            }
            const texts = []
            for (const el of divs) {
                let text = await el.getText();
                texts.push(text);
            }
            return texts;
        } catch (err) {
            await this.handleError(`Widget shortcut header is not displayed`, 'err_sh_widget_header', err);
        }
    }
}

module.exports = ShortcutsWidget;
