const Page = require('./page');
const appConst = require('../libs/app_const');

class LoginPage extends Page {

    get usernameInput() {
        return `input[id^='username-input']`
    }

    get passwordInput() {
        return `input[id^='password-input']`
    }

    get loginButton() {
        return `button[id^='login-button']`
    }

    async typeUserName(userName) {
        try {
            let usernameInput = await this.findElement(this.usernameInput);
            return await usernameInput.addValue(userName);
        } catch (err) {
            let screenshot = this.saveScreenshotUniqueName('err_user_name_input');
            throw new Error("Login page - user name input, screenshot: " + screenshot + ' ' + err);
        }
    }

    async clickOnLoginButton() {
        return this.clickOnElement(this.loginButton);
    }

    async typePassword() {
        try {
            let passwordInput = await this.findElement(this.passwordInput);
            await passwordInput.waitForDisplayed({timeout: 1000});
            await passwordInput.addValue('password');
        } catch (err) {
            let screenshot = this.saveScreenshotUniqueName('err_password_input');
            throw new Error("Login page - password input, screenshot: " + screenshot + ' ' + err);
        }
    }

    async waitForPageLoaded() {
        try {
            return await this.waitForElementDisplayed(this.usernameInput, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = this.saveScreenshotUniqueName('err_login+page');
            throw new Error("Login page - was not loaded, screenshot: " + screenshot + ' ' + err);
        }
    }

    getTitle() {
        return this.browser.getTitle();
    }

    async doLogin() {
        let usernameInput = await this.findElement(this.usernameInput);
        let passwordInput = await this.findElement(this.passwordInput);
        await usernameInput.waitForDisplayed({timeout: 1000});
        await usernameInput.addValue('su');
        await passwordInput.addValue('password');
        await this.pause(300);
        return await this.clickOnLoginButton();
    }
}

module.exports = LoginPage;
