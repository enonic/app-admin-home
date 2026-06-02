/*global require*/

const io = require('/lib/xp/io');

const BUILD_TIME_RESOURCE = '/assets/buildtime.json';

let cachedBuildTime;

const getBuildTime = () => {
    if (cachedBuildTime === undefined) {
        const resource = io.getResource(BUILD_TIME_RESOURCE);
        cachedBuildTime = resource && resource.exists()
            ? JSON.parse(io.readText(resource.getStream())).timeSinceEpoch
            : 0;
    }
    return cachedBuildTime;
};

exports.getBuildTime = getBuildTime;
