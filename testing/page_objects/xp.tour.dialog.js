/**
 * Created  on 21/03/2018.
 */
const page = require('./page');
const appConst = require('../libs/app_const');
const xpath = {
    container: `//div[contains(@id,'ModalDialog') and descendant::h2[contains(.,'Welcome Tour')]]`,
    skipTourButton: `//button[contains(@id,'DialogButton')]//span[contains(.,'Skip Tour')]`,
    nextButton: `//button[contains(@id,'DialogButton')]/span[text()='Next']`,
    previousButton: `//button[contains(@id,'DialogButton')]/span[text()='Previous']`,
    installAppsButton: `//button[contains(@id,'DialogButton')]/span[text()='Install Apps']`,
    title: `//h2[@class='title']`
};
var xpTourDialog = Object.create(page, {

    title: {
        get: function () {
            return `${xpath.container}` + `${xpath.title}`
        }
    },
    cancelButtonTop: {
        get: function () {
            return `${xpath.container}//div[@class='cancel-button-top']`
        }
    },
    skipTourButton: {
        get: function () {
            return `//div[@class='modal-dialog-footer']` + `${xpath.skipTourButton}`;
        }
    },
    nextButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.nextButton}`;
        }
    },
    previousButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.previousButton}`;
        }
    },
    installAppsButton: {
        get: function () {
            return `${xpath.container}` + `${xpath.installAppsButton}`;
        }
    },
    clickOnCancelButtonTop: {
        value: function () {
            return this.doClick(this.cancelButtonTop);
        }
    },
    clickOnNextButton: {
        value: function () {
            return this.doClick(this.nextButton).pause(500);
        }
    },
    goToFoursStep: {
        value: function () {
            return this.doClick(this.nextButton).pause(200).then(()=> {
                return this.doClick(this.nextButton);
            }).pause(200).then(()=> {
                return this.doClick(this.nextButton);
            });
        }
    },
    clickOnPreviousButton: {
        value: function () {
            return this.doClick(this.previousButton);
        }
    },
    clickOnSkipTourButton: {
        value: function () {
            return this.doClick(this.skipTourButton);
        }
    },
    waitForDialogPresent: {
        value: function () {
            return this.waitForVisible(`${xpath.container}`, appConst.TIMEOUT_2).catch(err=> {
                return false;
            })
        }
    },
    isCancelButtonTopDisplayed: {
        value: function () {
            return this.isElementDisplayed(this.cancelButtonTop)
        }
    },
    isNextButtonDisplayed: {
        value: function () {
            return this.isElementDisplayed(this.nextButton)
        }
    },
    waitFoPreviousButtonDisplayed: {
        value: function () {
            return this.waitForVisible(this.previousButton, appConst.TIMEOUT_3);
        }
    },
    isSkipTourButtonDisplayed: {
        value: function () {
            return this.isElementDisplayed(this.skipTourButton);
        }
    },
    waitForInstallAppsButtonDisplayed: {
        value: function () {
            return this.waitForVisible(this.installAppsButton, appConst.TIMEOUT_3);
        }
    },
    waitForDialogClosed: {
        value: function () {
            return this.waitForNotVisible(`${xpath.container}`, appConst.TIMEOUT_1);
        }
    },
    clickOnInstallAppsButton: {
        value: function () {
            return this.doClick(this.installAppsButton);
        }
    },
    waitForApplicationsStatus: {
        value: function () {
            let xpath = `//div[@class='demo-apps']//div[contains(@class,'demo-app-status')]`;
            return this.waitForVisible(xpath, appConst.INSTALL_APP_TIMEOUT).then(()=> {
                return this.getText(xpath);
            }).catch(err=> {
                console.log('Error when getting the statuses: ' + err);
                this.saveScreenshot('err_wait_install_app');
                return null;
            });
        }
    },
    getNamesOfAvailableApplications: {
        value: function () {
            return this.getText(`//div[@class='demo-apps']//div[@class='demo-app-title']`);
        }
    },
    getNamesOfInstalledApplications: {
        value: function () {
            let xpath = `${xpath.container}` + '';
            return this.getText(xpath, appConst.TIMEOUT_1);
        }
    },
    getTitle: {
        value: function () {
            return this.getText(this.title);
        }
    }
});
module.exports = xpTourDialog;




