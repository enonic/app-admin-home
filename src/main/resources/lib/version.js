/*global require*/

const admin = require('/lib/xp/admin');

const buildShortHashBean = __.newBean('com.enonic.xp.app.main.GetBuildShortHashScriptBean');

const getXpVersion = () => {
    const version = admin.getVersion();
    if (!version.endsWith('-SNAPSHOT')) {
        return version;
    }
    const shortHash = buildShortHashBean.execute();
    return shortHash ? `${version}+${shortHash}` : version;
};

exports.getXpVersion = getXpVersion;
