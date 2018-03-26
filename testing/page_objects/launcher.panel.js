/**
 * Created by on 6/26/2017.
 */
var page = require('./page');
var panel = {
    container: `//div[contains(@class,'launcher-main-container')]`
};

var launcherPanel = Object.create(page, {
    /**
     * define elements
     */
    homeLink: {
        get: function () {
            return `${panel.container}` + `//a[contains(@data-id,'home')]`;
        }
    },
    applicationsLink: {
        get: function (userName) {
            return `${panel.container}` + `//a[contains(@data-id,'app.applications')]`;
        }
    },
    contentStudioLink: {
        get: function () {
            return `${panel.container}` + `//a[contains(@data-id,'app.contentstudio')]`;
        }
    },
    usersLink: {
        get: function () {
            return `${panel.container}` + `//a[contains(@data-id,'app.users')]`;
        }
    },

    logoutLink: {
        get: function () {
            return `${panel.container}` + `//div[@class='user-logout']`;
        }
    },

    clickOnUsersLink: {
        value: function () {
            return this.waitForVisible(this.usersLink, 2000).then(()=> {
                return this.doClick(this.usersLink).catch(err=> {
                    console.log('err when click on Users link' + err);
                    throw new Error(err);
                })
            })
        }
    },
    clickOnLogoutLink: {
        value: function () {
            return this.waitForVisible(this.logoutLink, 2000).then(()=> {
                return this.doClick(this.logoutLink).catch(err=> {
                    console.log('err when click on Log Out link' + err);
                    throw new Error(err);
                })
            }).pause(800);
        }
    },
    waitForPanelVisible: {
        value: function (ms) {
            return this.waitForVisible(`${panel.container}`, ms).catch((err)=> {
                console.log('launcher panel is not opened ')
                return false;
            })
        }
    },
    isApplicationsLinkDisplayed: {
        value: function () {
            return this.isVisible(this.applicationsLink);
        }
    },
    isUsersLinkDisplayed: {
        value: function () {
            return this.isVisible(this.usersLink);
        }
    },

});
module.exports = launcherPanel;
