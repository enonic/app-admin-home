/**
 * Created on 04.12.2023.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConst = require('../../libs/app_const');
const testUtils = require('../../libs/test.utils');
const XpTourDialog = require('../../page_objects/xp.tour.dialog');
const HomePage = require('../../page_objects/home.page');
const ShortcutsWidget = require('../../page_objects/shortcuts.widget');

describe("XP tour dialog - tests for 'tourDisabled' = true", function () {

    this.timeout(appConst.TIMEOUT_SUITE);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    const WIDGET_SHORTCUTS_HEADER = 'Useful Links';

    it('GIVEN XP tour dialog is opened WHEN Next-button has been pressed 2 times THEN Install button should appear',
        async () => {
            const xpTourDialog = new XpTourDialog();
            let homePage = new HomePage();
            await homePage.waitForLoaded();
            // 1.'XP tour' dialog should not be loaded, tourDisabled = true:
            let isDisplayed = await xpTourDialog.isDisplayed();
            assert.ok(isDisplayed === false, "'XP tour' dialog should not be loaded");
        });

    it("WHEN Home Page is loaded THEN  'XP tour' button  should not  be present in toolbar",
        async () => {
            let homePage = new HomePage();
            let shortcutsWidget = new ShortcutsWidget();
            await homePage.waitForLoaded();
            let actualHeader = await shortcutsWidget.getWidgetShortcutHeader();
            assert.equal(actualHeader, WIDGET_SHORTCUTS_HEADER, "'Useful Links' header should be displayed");
            // 1. Verify that 'XP tour' button should not be displayed in the widget
            await shortcutsWidget.waitForXpTourItemNotDisplayed();
            // 2. 'About', 'Developer','Discuss' , 'Market', 'Slack' buttons should be displayed in the widget
            await shortcutsWidget.waitForAboutItemDisplayed();
            await shortcutsWidget.waitForDeveloperItemDisplayed();
            await shortcutsWidget.waitForDiscussItemDisplayed();
            await shortcutsWidget.waitForMarketItemDisplayed();
            await shortcutsWidget.waitForSlackItemDisplayed();
        });

    beforeEach(async () => {
        await testUtils.doDeleteCookie();
        return await testUtils.doLogin();
    });

    afterEach(() => testUtils.doDeleteCookie());
    before(() => {
        return console.log('specification starting: ' + this.title);
    });
});
