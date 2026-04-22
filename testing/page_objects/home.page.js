const Page = require('./page');
const appConst = require('../libs/app_const');

const XPATH = {
    container: "//div[contains(@class,'home-main-container')]",
    emptyState: "//div[contains(@class,'dashboard-empty-state')]",
};

class HomePage extends Page {

    async waitForLoaded() {
        try {
            await this.waitForElementDisplayed(XPATH.container, appConst.mediumTimeout);
            await this.pause(1000);
        } catch (err) {
            await this.handleError(`Home Page should be loaded`, 'err_home_page_load', err);
        }
    }

    async isDashboardVisible() {
        const cls = await this.getAttribute(XPATH.container, 'class');
        return (cls || '').includes('visible');
    }

    async waitForDashboardVisible(ms = appConst.mediumTimeout) {
        await this.getBrowser().waitUntil(
            async () => await this.isDashboardVisible(),
            {timeout: ms, timeoutMsg: 'Dashboard (home-main-container) did not become visible'}
        );
    }

    async getEmptyStateText() {
        await this.waitForElementDisplayed(XPATH.emptyState, appConst.mediumTimeout);
        return (await this.getText(XPATH.emptyState)).trim();
    }
}

module.exports = HomePage;
