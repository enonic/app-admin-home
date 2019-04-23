/**
 * Created on 10.09.2017.
 * Code migration to WebdriverIO on 22.04.2019.
 * Helper class that encapsulates webdriverio
 * and sets up mocha hooks for easier test writing.
 */
function WebDriverHelper() {
    this.browser = null;
}

WebDriverHelper.prototype.getBrowser = function () {
    return this.browser;
};

const makeChromeOptions = headless => ({
    "args": [
        ...(headless ? ["--headless", "--disable-gpu", "--no-sandbox"] : []),
        "--lang=en",
        '--disable-extensions',
        'window-size=1920,1100'
    ]
});

/**
 * Sets up a before and after mocha hook
 * that initialize and terminate the webdriverio session.
 */
WebDriverHelper.prototype.setupBrowser = function setupBrowser() {
    let _this = this;
    before(async function () {
        let PropertiesReader = require('properties-reader');
        let path = require('path');
        let webdriverio = require('webdriverio');
        let file = path.join(__dirname, '/../browser.properties');
        let properties = PropertiesReader(file);
        let browser_name = properties.get('browser.name');
        let platform_name = properties.get('platform');
        let baseUrl = properties.get('base.url');
        let chromeBinPath = properties.get('chrome.bin.path');
        let isHeadless = properties.get('is.headless');
        console.log('is Headless ##################### ' + isHeadless);
        console.log('browser name ##################### ' + browser_name);
        let options = {
            capabilities: {
                browserName: browser_name,
                platform: platform_name,
                binary: chromeBinPath,
                chromeOptions: makeChromeOptions(isHeadless)
            }
        };
        _this.browser = await webdriverio.remote(options)

        await _this.browser.url(baseUrl);
        console.log('webdriverio #####################  ' + 'is  initialized!');
        return _this.browser;
    });
    after(async function () {
        await _this.browser.deleteSession();
    });
    afterEach(function () {
        let state = this.currentTest.state ? this.currentTest.state.toString().toUpperCase() : 'FAILED';
        return console.log('Test:', this.currentTest.title, ' is  ' + state);

    });
};

module.exports = new WebDriverHelper();
