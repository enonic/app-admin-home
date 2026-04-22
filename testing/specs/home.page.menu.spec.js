const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const testUtils = require('../libs/test.utils');
const HomePage = require('../page_objects/home.page');
const MenuPanel = require('../page_objects/menu.panel');

const EXPECTED_SHORTCUTS = ['Developer', 'Slack', 'Enonic forum', 'Enonic market'];
const DASHBOARD_TOOL_NAME = 'Dashboard';
const NO_WIDGETS_TEXT = 'No dashboard widgets installed';

describe('Home Page, XP Menu specification', function () {
    this.timeout(appConst.TIMEOUT_SUITE);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }

    before(async () => {
        if (typeof browser !== 'undefined') {
            await testUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        await testUtils.doLogin();
    });

    beforeEach(async () => {
        // Navigate back to the home tool so the menu auto-opens afresh for every test.
        await testUtils.getBrowser().url('http://localhost:8080/admin');
        await testUtils.getBrowser().pause(500);
    });

    it('GIVEN Home Page is loaded THEN XP Menu should open automatically',
        async function () {
            const homePage = new HomePage();
            const menuPanel = new MenuPanel();
            await homePage.waitForLoaded();
            await menuPanel.waitForMenuPanelOpened();
            await testUtils.saveScreenshot('menu_panel_opened');
            const opened = await menuPanel.isMenuPanelOpened();
            assert.ok(opened, 'Menu panel should be opened automatically after page load');
        });

    it('GIVEN XP Menu is opened THEN shortcuts should be listed in the left info panel',
        async function () {
            const homePage = new HomePage();
            const menuPanel = new MenuPanel();
            await homePage.waitForLoaded();
            await menuPanel.waitForMenuPanelOpened();
            await testUtils.saveScreenshot('menu_panel_opened_2');
            const captions = await menuPanel.getShortcutCaptions();
            for (const expected of EXPECTED_SHORTCUTS) {
                assert.ok(
                    captions.includes(expected),
                    `Expected shortcut '${expected}' to be present in left menu panel, got: ${JSON.stringify(captions)}`
                );
            }
        });

    it(`GIVEN XP Menu is opened THEN '${DASHBOARD_TOOL_NAME}' tool should be listed among installed apps`,
        async function () {
            const homePage = new HomePage();
            const menuPanel = new MenuPanel();
            await homePage.waitForLoaded();
            await menuPanel.waitForMenuPanelOpened();
            const appNames = await menuPanel.getAppTileNames();
            assert.ok(
                appNames.includes(DASHBOARD_TOOL_NAME),
                `Expected '${DASHBOARD_TOOL_NAME}' tool to be listed in installed apps, got: ${JSON.stringify(appNames)}`
            );
        });

    it('GIVEN XP Menu is opened WHEN the menu button is clicked THEN the menu closes and dashboard is revealed',
        async function () {
            const homePage = new HomePage();
            const menuPanel = new MenuPanel();
            await homePage.waitForLoaded();
            await menuPanel.waitForMenuPanelOpened();
            await menuPanel.clickOnMenuButton();
            await testUtils.saveScreenshot('menu_panel_closed');
            await menuPanel.waitForMenuPanelClosed();
            await homePage.waitForDashboardVisible();
            const isVisible = await homePage.isDashboardVisible();
            assert.ok(isVisible, 'Dashboard should be visible after closing the XP Menu');
        });

    it(`GIVEN no widgets are installed WHEN dashboard is visible THEN empty-state text '${NO_WIDGETS_TEXT}' should be shown`,
        async function () {
            const homePage = new HomePage();
            const menuPanel = new MenuPanel();
            await homePage.waitForLoaded();
            await menuPanel.waitForMenuPanelOpened();
            await menuPanel.clickOnMenuButton();
            await menuPanel.waitForMenuPanelClosed();
            await homePage.waitForDashboardVisible();
            await testUtils.saveScreenshot('no_widgets_text');
            const text = await homePage.getEmptyStateText();
            assert.strictEqual(
                text,
                NO_WIDGETS_TEXT,
                `Expected empty-state text to be '${NO_WIDGETS_TEXT}', got: '${text}'`
            );
        });
});
