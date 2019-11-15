import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {MarketApplication, MarketAppStatus, MarketAppStatusFormatter} from 'lib-admin-ui/application/MarketApplication';
import {Body} from 'lib-admin-ui/dom/Body';
import {ResponsiveManager} from 'lib-admin-ui/ui/responsive/ResponsiveManager';
import {IsAuthenticatedRequest} from 'lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {i18n} from 'lib-admin-ui/util/Messages';
import {RoleKeys} from 'lib-admin-ui/security/RoleKeys';
import {LoginResult} from 'lib-admin-ui/security/auth/LoginResult';
import {PrincipalKey} from 'lib-admin-ui/security/PrincipalKey';
import {ModalDialogWithConfirmation} from 'lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {Action} from 'lib-admin-ui/ui/Action';
import {LoadMask} from 'lib-admin-ui/ui/mask/LoadMask';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ListApplicationsRequest} from 'lib-admin-ui/application/ListApplicationsRequest';
import {ListMarketApplicationsRequest} from 'lib-admin-ui/application/ListMarketApplicationsRequest';
import {MarketApplicationResponse} from 'lib-admin-ui/application/MarketApplicationResponse';
import {Application} from 'lib-admin-ui/application/Application';
import {Application as AppApplication} from 'lib-admin-ui/app/Application';
import {MarketHelper} from 'lib-admin-ui/application/MarketHelper';
import {Path} from 'lib-admin-ui/rest/Path';
import {ServerEventsListener} from 'lib-admin-ui/event/ServerEventsListener';
import {ApplicationEvent, ApplicationEventType} from 'lib-admin-ui/application/ApplicationEvent';
import {ProgressBar} from 'lib-admin-ui/ui/ProgressBar';
import {InstallUrlApplicationRequest} from 'lib-admin-ui/application/InstallUrlApplicationRequest';
import {ApplicationInstallResult} from 'lib-admin-ui/application/ApplicationInstallResult';

let tourDialog: ModalDialogWithConfirmation;
let demoAppsLoadMask: LoadMask;
let isInstallingDemoAppsNow = false;
let canInstallDemoApps = false;
let marketDemoApps: MarketApplication[] = [];
let tourSteps: Element[] = [];
let demoAppsInstalled = false;
let isSystemAdmin = false;

const demoAppsNames = [
    'com.enonic.app.contentstudio',
    'systems.rcd.enonic.datatoolbox',
    'com.enonic.app.livetrace'
];

export function init(config: GlobalConfig) {
    initDialog(config);
    initTourSteps(config);

    return checkAdminRights().then(() => {
        if (isSystemAdmin) {
            appendInstallAppStep();
        }
        setTourStep(1);
        Body.get().appendChild(tourDialog);
        // Hack: Make sure the correct size is set on first-time run.
        ResponsiveManager.fireResizeEvent();

        return tourDialog;
    });
}

function appendInstallAppStep() {
    tourSteps.push(createStep3());
    tourDialog.setTitle(i18n('tour.title.stepXofY', 1, 4));
}

function checkAdminRights() {
    return new IsAuthenticatedRequest()
        .sendAndParse()
        .then((loginResult: LoginResult) => {
            isSystemAdmin = loginResult
                .getPrincipals()
                .some((key: PrincipalKey) => key.equals(RoleKeys.ADMIN));

        });
}

function initDialog(config: GlobalConfig) {
    tourDialog = new ModalDialogWithConfirmation({
        title: i18n('tour.title.stepXofY', 1, 3),
        skipTabbable: true
    });
    tourDialog.addClass('xp-tour-dialog');

    initNavigation(config);
}

function initNavigation(config: GlobalConfig) {
    const previousStepAction = new Action(i18n('tour.action.skip'));
    const previousStepActionButton = tourDialog.addAction(previousStepAction);

    const nextStepAction = new Action(i18n('tour.action.next'));
    const nextStepActionButton = tourDialog.addAction(nextStepAction);

    let currentStep = 1;
    previousStepAction.onExecuted(() => {
        if (currentStep === 1) {
            tourDialog.close();
        } else {
            currentStep -= 1;
            if (currentStep === 1) {
                previousStepActionButton.setLabel(i18n('tour.action.skip'));
            }
            nextStepActionButton.setEnabled(true);
            nextStepActionButton.setLabel(i18n('action.next'));
            nextStepActionButton.removeClass('last-step');
            setTourStep(currentStep);

            if (demoAppsLoadMask) {
                demoAppsLoadMask.hide();
            }
        }
    });

    nextStepAction.onExecuted(() => {
        if (currentStep === tourSteps.length) {
            if (canInstallDemoApps) {
                // if install is hit
                nextStepActionButton.setLabel(i18n('tour.action.installing'));
                nextStepActionButton.setEnabled(false);
                isInstallingDemoAppsNow = true;

                Q.all(loadDemoApps()).spread(() => {
                    if (currentStep === tourSteps.length) {
                        // if still on install apps page of xp tour
                        nextStepActionButton.setLabel(
                            i18n('tour.action.finish')
                        );
                        nextStepActionButton.addClass('last-step');
                        nextStepActionButton.setEnabled(true);
                    }
                    isInstallingDemoAppsNow = false;
                    canInstallDemoApps = false;
                });
            } else {
                // Finish button was hit
                tourDialog.close();
                nextStepActionButton.setLabel(i18n('tour.action.next'));
                nextStepActionButton.removeClass('last-step');
                previousStepActionButton.setLabel(i18n('tour.action.skip'));
                currentStep = 1;
                setTourStep(currentStep);
            }
        } else {
            currentStep += 1;

            previousStepActionButton.setLabel(i18n('tour.action.previous'));
            setTourStep(currentStep);

            if (currentStep === tourSteps.length) {
                if (tourSteps.length === 3 && !demoAppsInstalled) {
                    let demoAppsContainer = Element.fromHtmlElement(
                        document.querySelector('.demo-apps')
                    );

                    if (!demoAppsLoadMask) {
                        demoAppsLoadMask = new LoadMask(demoAppsContainer);
                        tourDialog.onHidden(() => {
                            demoAppsLoadMask.hide();
                        });
                    }

                    demoAppsContainer.removeClass('failed');

                    demoAppsLoadMask.show();

                    nextStepActionButton.setLabel(i18n('tour.action.finish'));
                    nextStepActionButton.addClass('last-step');

                    fetchDemoAppsFromMarket(config)
                        .then(function (apps: MarketApplication[]) {
                            marketDemoApps = apps || [];
                            canInstallDemoApps = marketDemoApps
                                .some((marketDemoApp: MarketApplication) =>
                                    marketDemoApp.getStatus() !== MarketAppStatus.INSTALLED
                                );

                            demoAppsInstalled = !!apps && !canInstallDemoApps;

                            tourSteps[tourSteps.length - 1] = createStep3();

                            if (currentStep === tourSteps.length) {
                                // if still on install apps page of xp tour
                                setTourStep(currentStep);
                                demoAppsContainer = Element.fromHtmlElement(
                                    document.querySelector('.demo-apps')
                                );
                                if (canInstallDemoApps) {
                                    nextStepActionButton.setLabel(
                                        i18n('tour.action.install')
                                    );
                                    nextStepActionButton.removeClass(
                                        'last-step'
                                    );
                                }
                            }
                        })
                        .catch(DefaultErrorHandler.handle)
                        .finally(() => {
                            demoAppsContainer.toggleClass(
                                'failed',
                                marketDemoApps.length === 0
                            );
                            demoAppsLoadMask.hide();
                        });
                } else if (isInstallingDemoAppsNow) {
                    nextStepActionButton.setLabel(
                        i18n('tour.action.installing')
                    );
                    nextStepActionButton.setEnabled(false);
                } else if (canInstallDemoApps) {
                    nextStepActionButton.setLabel(i18n('tour.action.install'));
                } else {
                    nextStepActionButton.setLabel(i18n('tour.action.finish'));
                    nextStepActionButton.addClass('last-step');
                }
            }
        }
    });
}

function initTourSteps(config: GlobalConfig) {
    tourSteps = [createStep1(config), createStep2(config)];
}

function createStep1(config: GlobalConfig) {
    const html = `
        <div class="xp-tour-step step-1">
            <div class="subtitle">
                <div class="subtitle-part-1">${i18n('tour.step1.subtitle1')}</div>
                <div class="subtitle-part-2">${i18n('tour.step1.subtitle2')}</div>
            </div>
            <div class="caption">${i18n('tour.step1.caption')}</div>
            <img src="${config.assetsUri}/images/launcher.svg">
            <div class="text">
                <div class="paragraph1">${i18n('tour.step1.paragraph1')}</div>
                <div class="paragraph2">${i18n('tour.step1.paragraph2')}</div>
            </div>
        </div>`;

    return Element.fromString(html);
}

function createStep2(config: GlobalConfig) {
    const html = `
    <div class="xp-tour-step step-2">
        <div class="subtitle">
            <div class="subtitle-part-1">${i18n('tour.step2.subtitle1')}</div>
            <div class="subtitle-part-2">${i18n('tour.step2.subtitle2')}</div>
        </div>
        <div class="caption">${i18n('tour.step2.caption')}</div>
        <img src="${config.assetsUri}/images/market.svg">
        <div class="text">
            <div class="paragraph1">
                ${i18n('tour.step2.paragraph1')}
                <a href="/admin/tool/com.enonic.xp.app.applications/main" target="_blank">${i18n('tour.step2.paragraph1hreftext')}</a>.
            </div>
            <div class="paragraph2">
                <a href="https://market.enonic.com/" target="_blank">${i18n('tour.step2.paragraph2hreftext')}</a>
                ${i18n('tour.step2.paragraph2')}
            </div>
            <div class="paragraph3">
                ${i18n('tour.step2.paragraph3')}
                <a href="https://developer.enonic.com/docs/xp/" target="_blank">${i18n('tour.step2.paragraph3hreftext')}</a>.
            </div>
        </div>
    </div>`;

    return Element.fromString(html);
}

function createStep3() {
    const html = `
        <div class="xp-tour-step step-3">
            <div class="subtitle">
                <div class="subtitle-part-1">${i18n('tour.step3.subtitle1')}</div>
                <div class="subtitle-part-2">${i18n('tour.step3.subtitle2')}</div>
            </div>
            <div class="caption">${i18n('tour.step3.caption')}</div>
            <div class="text">
                <div class="paragraph1">${i18n('tour.step3.paragraph1')}</div>
            </div>
            <div class="demo-apps">${getAppsDiv()}</div>
        </div>`;

    return Element.fromString(html);
}

function getAppsDiv() {
    return marketDemoApps.length > 0
           ? getDemoAppsHtml()
           : `<div class="demo-apps-text">${i18n('tour.apps.notavailable')}</div>`;
}

function getDemoAppsHtml() {
    let html = '';
    marketDemoApps.forEach((marketDemoApp: MarketApplication) => {
        const status = MarketAppStatusFormatter.formatStatus(marketDemoApp.getStatus());
        const appStatus = MarketAppStatusFormatter.getStatusCssClass(marketDemoApp.getStatus());
        html += `
            <div class="demo-app" id="${marketDemoApp.getName()}">
                <a href="${marketDemoApp.getUrl()}" target="_blank">
                    <img class="demo-app-icon" src="${marketDemoApp.getIconUrl()}">
                    <div class="demo-app-title">${marketDemoApp.getDisplayName()}</div>
                </a>
                <div class="demo-app-status ${appStatus}">${status}</div>
            </div>`;
    });

    return html;
}

function fetchDemoAppsFromMarket(config: GlobalConfig): Q.Promise<MarketApplication[]> {
    const appPromises: Q.Promise<any>[] = [
        new ListApplicationsRequest().sendAndParse(),
        new ListMarketApplicationsRequest()
            .setStart(0)
            .setCount(demoAppsNames.length)
            .setVersion(config.xpVersion)
            .setIds(demoAppsNames)
            .sendAndParse()
    ];

    return Q
        .all(appPromises)
        .spread(function (installedApplications: Application[], marketApplications: MarketApplicationResponse) {
            const apps = marketApplications.getApplications();
            apps.forEach((marketDemoApp: MarketApplication) => {
                for (let i = 0; i < installedApplications.length; i++) {
                    if (
                        marketDemoApp
                            .getAppKey()
                            .equals(
                                installedApplications[i].getApplicationKey()
                            )
                    ) {
                        if (
                            MarketHelper.installedAppCanBeUpdated(
                                marketDemoApp,
                                installedApplications[i]
                            )
                        ) {
                            marketDemoApp.setStatus(
                                MarketAppStatus
                                    .OLDER_VERSION_INSTALLED
                            );
                        } else {
                            marketDemoApp.setStatus(
                                MarketAppStatus.INSTALLED
                            );
                        }
                        break;
                    }
                }
            });
            return apps;
        });
}

function loadDemoApps() {
    enableApplicationServerEventsListener();

    const loadingAppsPromises = [];

    marketDemoApps.forEach((marketDemoApp: MarketApplication) => {
        if (marketDemoApp.getStatus() !== MarketAppStatus.INSTALLED) {
            loadingAppsPromises.push(loadApp(marketDemoApp));
        }
    });

    return loadingAppsPromises;
}

// Required to update progress bar
function enableApplicationServerEventsListener() {
    const application = new AppApplication(
        'applications',
        'Applications',
        'AM',
        'applications'
    );
    application.setPath(Path.fromString('/'));
    application.setWindow(window);
    const serverEventsListener = new ServerEventsListener([application]);
    serverEventsListener.start();
}

function loadApp(marketDemoApp: MarketApplication) {
    const url = marketDemoApp.getLatestVersionDownloadUrl();
    const demoAppContainer = document.getElementById(marketDemoApp.getName());

    const progressBar = new ProgressBar(0);
    const progressHandler = function (event: ApplicationEvent) {
        if (event.getApplicationUrl() === url && event.getEventType() === ApplicationEventType.PROGRESS) {
            progressBar.setValue(event.getProgress());
        }
    };

    ApplicationEvent.on(progressHandler);
    demoAppContainer.appendChild(progressBar.getHTMLElement());

    return new InstallUrlApplicationRequest(url)
        .sendAndParse()
        .then((result: ApplicationInstallResult) => {
            ApplicationEvent.un(progressHandler);
            progressBar.remove();

            const statusContainer = tourSteps[tourSteps.length - 1]
                .findChildById(marketDemoApp.getName(), true)
                .getHTMLElement()
                .querySelector('.demo-app-status');
            if (!result.getFailure()) {
                statusContainer.className = 'demo-app-status installed';
                statusContainer.textContent = i18n(
                    'status.installed'
                );
            } else {
                statusContainer.className = 'demo-app-status failure';
                statusContainer.textContent = i18n('tour.apps.status.failed');
            }
        }).catch(DefaultErrorHandler.handle);
}

function updateHeaderStep(step: number) {
    const totalSteps = isSystemAdmin ? '3' : '2';
    tourDialog.setTitle(i18n('tour.title.stepXofY', step, totalSteps));
}

function setTourStep(step: number) {
    updateHeaderStep(step);
    tourDialog.getContentPanel().removeChildren();
    tourDialog.appendChildToContentPanel(tourSteps[step - 1]);
}
