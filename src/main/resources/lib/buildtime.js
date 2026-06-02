/*global require*/

const io = require('/lib/xp/io');

const BUILD_TIME_RESOURCE = '/assets/buildtime.json';

let cachedBuildTime;

// Returns the build timestamp written by scripts/postbuild.mjs. Used as a
// cache-busting path segment in static asset URLs so that lib-static's default
// "immutable" cache-control is safe across app upgrades.
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