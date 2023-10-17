import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {MarketApplication, MarketAppStatus, MarketAppStatusFormatter} from '@enonic/lib-admin-ui/application/MarketApplication';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {ModalDialogWithConfirmation} from '@enonic/lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ListApplicationsRequest} from '../home/resource/ListApplicationsRequest';
import {ListMarketApplicationsRequest} from '@enonic/lib-admin-ui/application/ListMarketApplicationsRequest';
import {MarketApplicationResponse} from '@enonic/lib-admin-ui/application/MarketApplicationResponse';
import {Application} from '@enonic/lib-admin-ui/application/Application';
import {Application as AppApplication} from '@enonic/lib-admin-ui/app/Application';
import {MarketHelper} from '@enonic/lib-admin-ui/application/MarketHelper';
import {Path} from '@enonic/lib-admin-ui/rest/Path';
import {ServerEventsListener} from '@enonic/lib-admin-ui/event/ServerEventsListener';
import {ApplicationEvent, ApplicationEventType} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {ProgressBar} from '@enonic/lib-admin-ui/ui/ProgressBar';
import {InstallUrlApplicationRequest} from '../home/resource/InstallUrlApplicationRequest';
import {ApplicationInstallResult} from '../home/resource/ApplicationInstallResult';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {KeyHelper} from '@enonic/lib-admin-ui/ui/KeyHelper';

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
    'com.enonic.app.guillotine',
];

export function init() {
    initDialog();
    initTourSteps();

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
    tourDialog.setHeading(i18n('tour.title.stepXofY', 1, 4));
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

function initDialog() {
    tourDialog = new ModalDialogWithConfirmation({
        title: i18n('tour.title.stepXofY', 1, 3),
        skipTabbable: true,
    });
    tourDialog.addClass('xp-tour-dialog');

    tourDialog.onKeyDown((event: KeyboardEvent) => {
        if (KeyHelper.isEscKey(event)){
            tourDialog.close();
        }
    });

    initNavigation();
}

function initNavigation() {
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

                void Q.all(loadDemoApps()).spread(() => { // This actually comes all the way from lib-admin-ui HttpRequest.sendAndParse which currently is a Q.Promise :(
                    if (currentStep === tourSteps.length) {
                        // if still on install apps page of xp tour
                        nextStepActionButton.setLabel(
                            i18n('tour.action.finish'),
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
                        document.querySelector('.demo-apps'),
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

                    fetchDemoAppsFromMarket()
                        .then(function (apps: MarketApplication[]) {
                            marketDemoApps = apps || [];
                            canInstallDemoApps = marketDemoApps
                                .some((marketDemoApp: MarketApplication) =>
                                    marketDemoApp.getStatus() !== MarketAppStatus.INSTALLED,
                                );

                            demoAppsInstalled = !!apps && !canInstallDemoApps;

                            tourSteps[tourSteps.length - 1] = createStep3();

                            if (currentStep === tourSteps.length) {
                                // if still on install apps page of xp tour
                                setTourStep(currentStep);
                                demoAppsContainer = Element.fromHtmlElement(
                                    document.querySelector('.demo-apps'),
                                );
                                if (canInstallDemoApps) {
                                    nextStepActionButton.setLabel(
                                        i18n('tour.action.installApps'),
                                    );
                                    nextStepActionButton.removeClass(
                                        'last-step',
                                    );
                                }
                            }
                        })
                        .catch(e => DefaultErrorHandler.handle(e))
                        .finally(() => {
                            demoAppsContainer.toggleClass(
                                'failed',
                                marketDemoApps.length === 0,
                            );
                            demoAppsLoadMask.hide();
                        });
                } else if (isInstallingDemoAppsNow) {
                    nextStepActionButton.setLabel(
                        i18n('tour.action.installing'),
                    );
                    nextStepActionButton.setEnabled(false);
                } else if (canInstallDemoApps) {
                    nextStepActionButton.setLabel(i18n('tour.action.installApps'));
                } else {
                    nextStepActionButton.setLabel(i18n('tour.action.finish'));
                    nextStepActionButton.addClass('last-step');
                }
            }
        }
    });
}

function initTourSteps() {
    tourSteps = [createStep1(), createStep2()];
}

function createStep1(): Element {
    const html = `
        <div class="xp-tour-step step-1">
            <div class="subtitle">
                <div class="subtitle-part-1">${i18n('tour.step1.subtitle1')}</div>
                <div class="subtitle-part-2">${i18n('tour.step1.subtitle2')}</div>
            </div>
            <div class="caption">${i18n('tour.step1.caption')}</div>
            <img src="${CONFIG.getString('assetsUri')}/images/launcher.svg">
            <div class="text">
                <div class="paragraph1">${i18n('tour.step1.paragraph1')}</div>
                <div class="paragraph2">${i18n('tour.step1.paragraph2')}</div>
            </div>
        </div>`;

    return Element.fromHtml(html);
}

function createStep2(): Element {
    const html = `
    <div class="xp-tour-step step-2">
        <div class="subtitle">
            <div class="subtitle-part-1">${i18n('tour.step2.subtitle1')}</div>
            <div class="subtitle-part-2">${i18n('tour.step2.subtitle2')}</div>
        </div>
        <div class="caption">${i18n('tour.step2.caption')}</div>
        <img src="${CONFIG.getString('assetsUri')}/images/market.svg">
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

    return Element.fromHtml(html);
}

function createStep3(): Element {
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

    return Element.fromHtml(html);
}

function getAppsDiv() {
    return marketDemoApps.length > 0
           ? getDemoAppsHtml()
           : `<div class="demo-apps-text">${i18n('tour.apps.notavailable')}</div>`;
}

function getDemoAppsHtml() {
    let html = '';
    marketDemoApps.forEach((marketDemoApp: MarketApplication) => {
        const status = MarketAppStatusFormatter.createStatusElement(marketDemoApp.getStatus()).toString();
        const appStatus = MarketAppStatusFormatter.getStatusCssClass(marketDemoApp.getStatus());
        html += `
            <div class="demo-app ${appStatus}" id="${marketDemoApp.getName()}">
                <a href="${marketDemoApp.getUrl()}" target="_blank" rel="noopener">
                    <img class="demo-app-icon" src="${marketDemoApp.getIconUrl()}">
                    <div class="demo-app-title">${marketDemoApp.getDisplayName()}</div>
                </a>
                <div class="demo-app-status">${status}</div>
            </div>`;
    });

    return html;
}

function fetchDemoAppsFromMarket(): Q.Promise<MarketApplication[]> {
    const appPromises: (Q.Promise<Application[] | MarketApplicationResponse>)[] = [
        new ListApplicationsRequest().sendAndParse(), // This actually comes all the way from lib-admin-ui HttpRequest.sendAndParse which currently is a Q.Promise :(
        new ListMarketApplicationsRequest()
            .setUrl(CONFIG.getString('marketUrl'))
            .setStart(0)
            .setCount(demoAppsNames.length)
            .setVersion(CONFIG.getString('xpVersion'))
            .setIds(demoAppsNames)
            .sendAndParse(),
    ];

    return Q
        .all(appPromises)
        .spread(function (installedApplications: Application[], marketApplications: MarketApplicationResponse) {
            const apps = marketApplications.getApplications();
            apps.forEach((marketDemoApp: MarketApplication) => {
                for (const installedApplication of installedApplications) {
                    if (
                        marketDemoApp
                            .getAppKey()
                            .equals(
                                installedApplication.getApplicationKey(),
                            )
                    ) {
                        if (
                            MarketHelper.installedAppCanBeUpdated(
                                marketDemoApp,
                                installedApplication,
                            )
                        ) {
                            marketDemoApp.setStatus(
                                MarketAppStatus
                                    .OLDER_VERSION_INSTALLED,
                            );
                        } else {
                            marketDemoApp.setStatus(
                                MarketAppStatus.INSTALLED,
                            );
                        }
                        break;
                    }
                }
            });
            return apps;
        });
}

function loadDemoApps(): Q.Promise<void>[] { // This actually comes all the way from lib-admin-ui HttpRequest.sendAndParse which currently is a Q.Promise :(
    enableApplicationServerEventsListener();

    const loadingAppsPromises: Q.Promise<void>[] = [];

    marketDemoApps.forEach((marketDemoApp: MarketApplication) => {
        if (marketDemoApp.getStatus() !== MarketAppStatus.INSTALLED) {
            loadingAppsPromises.push(loadApp(marketDemoApp));
        }
    });

    return loadingAppsPromises;
}

// Required to update progress bar
function enableApplicationServerEventsListener() {
    const application: AppApplication = new AppApplication(
        'applications',
        'Applications',
        'AM',
        'applications',
    );
    application.setPath(Path.fromString('/'));
    application.setWindow(window);
    const serverEventsListener = new ServerEventsListener([application]);
    serverEventsListener.start();
}

function loadApp(marketDemoApp: MarketApplication): Q.Promise<void> { // This actually comes all the way from lib-admin-ui HttpRequest.sendAndParse which currently is a Q.Promise :(
    const url: string = marketDemoApp.getLatestVersionDownloadUrl();
    const demoAppContainer: HTMLElement = document.getElementById(marketDemoApp.getName());

    const progressBar: ProgressBar = new ProgressBar(0);
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

            const appContainer: HTMLElement = tourSteps[tourSteps.length - 1]
                .findChildById(marketDemoApp.getName(), true)
                .getHTMLElement();

            const statusContainer: HTMLElement = appContainer.querySelector('.demo-app-status');

            if (!result.getFailure()) {
                appContainer.className = 'demo-app installed';
                statusContainer.textContent = i18n('status.installed');
            } else {
                appContainer.className = 'demo-app failure';
                statusContainer.textContent = i18n('tour.apps.status.failed');
            }
        }).catch(e => DefaultErrorHandler.handle(e));
}

function updateHeaderStep(step: number) {
    const totalSteps: string = isSystemAdmin ? '3' : '2';
    tourDialog.setHeading(i18n('tour.title.stepXofY', step, totalSteps));
}

function setTourStep(step: number) {
    updateHeaderStep(step);
    tourDialog.getContentPanel().removeChildren();
    tourDialog.appendChildToContentPanel(tourSteps[step - 1]);
}
