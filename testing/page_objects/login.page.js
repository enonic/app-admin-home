const Page = require('./page');

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
        let usernameInput = await this.findElement(this.usernameInput);
        return await usernameInput.addValue(userName);
    }

    async clickOnLoginButton() {
        return this.clickOnElement(this.loginButton);
    }

    async typePassword() {
        let passwordInput = await this.findElement(this.passwordInput);
        await passwordInput.waitForDisplayed({timeout: 1000});
        await passwordInput.addValue("password");
    }

    waitForPageLoaded(ms) {
        return this.browser.$(`//input[contains(@id,'username-input')]`).then(element => {
            return element.waitForDisplayed({timeout: ms});
        });
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
