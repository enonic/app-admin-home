const Page = require('./page');
const appConst = require('../libs/app_const');

const HOST = 'xp-menu';

class MenuPanel extends Page {

    async getHost() {
        return await this.getBrowser().$(HOST);
    }

    async waitForHostPresent(ms = appConst.mediumTimeout) {
        const host = await this.getHost();
        await host.waitForExist({timeout: ms});
        return host;
    }

    async getMenuPanel() {
        const host = await this.waitForHostPresent();
        return await host.shadow$('#menu-panel');
    }

    async isMenuPanelOpened() {
        const panel = await this.getMenuPanel();
        const cls = await panel.getAttribute('class');
        return (cls || '').includes('visible');
    }

    async waitForMenuPanelOpened(ms = appConst.mediumTimeout) {
        try {
            await this.getBrowser().waitUntil(
                async () => await this.isMenuPanelOpened(),
                {timeout: ms, timeoutMsg: 'Menu panel is not visible/opened'}
            );
        } catch (err) {
            await this.handleError('Menu panel is not visible/opened after waiting', 'err_menu_panel_not_opened', err);
        }
    }

    async waitForMenuPanelClosed(ms = appConst.mediumTimeout) {
        await this.getBrowser().waitUntil(
            async () => !(await this.isMenuPanelOpened()),
            {timeout: ms, timeoutMsg: 'Menu panel is still visible/not closed'}
        );
    }

    async getShortcutCaptions() {
        const host = await this.waitForHostPresent();
        const captions = await host.shadow$$('.menu-info-links .menu-info-link-row .menu-info-link-caption');
        const texts = [];
        for (const el of captions) {
            texts.push((await el.getText()).trim());
        }
        return texts;
    }

    async getAppTileNames() {
        const host = await this.waitForHostPresent();
        const names = await host.shadow$$('.menu-app-container .app-grid .app-tile .app-tile-name');
        const texts = [];
        for (const el of names) {
            texts.push((await el.getText()).trim());
        }
        return texts;
    }

    async clickOnMenuButton() {
        try {
            const host = await this.waitForHostPresent();
            const btn = await host.shadow$('#menu-button');
            await btn.waitForDisplayed({timeout: appConst.mediumTimeout});
            await btn.click();
            await this.pause(400);
        } catch (err) {
            await this.handleError('Error during clicking on menu button', 'err_click_menu_button', err);
        }
    }
}

module.exports = MenuPanel;
