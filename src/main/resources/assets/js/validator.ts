import {Validator} from 'lib-admin-ui/validator/Validator';

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export function validateConfig(config: GlobalConfig): ValidationResult {
    const urlsResult = validateUrls(config);
    const versionsResult = validateVersions(config);
    const textResult = validateText(config);

    const valid = urlsResult.valid && versionsResult.valid && textResult.valid;

    const errors = [...urlsResult.errors, ...versionsResult.errors, ...textResult.errors];

    return {valid, errors};
}

function validateUrls(config: GlobalConfig): ValidationResult {
    const {adminUrl, assetsUri, i18nUrl, launcherUrl} = config;

    let valid = true;
    const errors = [];

    if (adminUrl && !Validator.validUrl(adminUrl)) {
        valid = false;
        errors.push(`Admin URL (${adminUrl}) is invalid.`);
    }

    if (assetsUri && !Validator.validUrl(assetsUri)) {
        valid = false;
        errors.push(`Assets URI (${assetsUri}) is invalid.`);
    }

    if (i18nUrl && !Validator.validUrl(i18nUrl)) {
        valid = false;
        errors.push(`i18n URL (${i18nUrl}) is invalid.`);
    }

    if (launcherUrl && !Validator.validUrl(launcherUrl)) {
        valid = false;
        errors.push(`Launcher URL (${launcherUrl}) is invalid.`);
    }

    return {valid, errors};
}

function validateVersions(config: GlobalConfig): ValidationResult {
    const {xpVersion} = config;

    let valid = true;
    const errors = [];

    // Using `validVersion` may lead to error,
    // since no XP version are in valid SemVer format.
    if (xpVersion && !Validator.safeText(xpVersion)) {
        valid = false;
        errors.push(`XP version (${xpVersion}) is invalid.`);
    }

    return {valid, errors};
}

function validateText(config: GlobalConfig): ValidationResult {
    const {appId, launcherButtonCls} = config;

    let valid = true;
    const errors = [];

    if (appId && !Validator.safeText(appId)) {
        valid = false;
        errors.push(`appId (${appId}) is invalid.`);
    }

    if (launcherButtonCls && !Validator.safeText(launcherButtonCls)) {
        valid = false;
        errors.push(`Launcher button class (${launcherButtonCls}) is invalid.`);
    }

    return {valid, errors};
}
