const core = require("@actions/core");
const toolCache = require("@actions/tool-cache");
const fs = require("fs-extra");
const path = require("path");

const { restoreRPCCache } = require("./cache");
const { getDownloadObject } = require("./utils");

async function main() {
  try {
    // Get version input
    const version = core.getInput("version");

    // Download the archive containing the binaries
    const download = getDownloadObject(version);
    core.info(`Downloading Foundry '${version}' from: ${download.url}`);
    const pathToArchive = await toolCache.downloadTool(download.url);

    // Extract the archive onto host runner
    core.debug(`Extracting ${pathToArchive}`);
    const extract = download.url.endsWith(".zip") ? toolCache.extractZip : toolCache.extractTar;
    const pathToCLI = await extract(pathToArchive);

    // Append `-3074` to binaries inside download.binPath
    const binPath = path.join(pathToCLI, download.binPath);

    // loop over files in binPath
    const files = fs.readdirSync(binPath);
    for (const file of files) {
      const filePath = path.join(binPath, file);
      const newFilePath = path.join(binPath, `${file}-3074`);
      fs.renameSync(filePath, newFilePath);
    }

    // Expose the tool
    core.addPath(binPath);

    // Get cache input
    const cache = core.getBooleanInput("cache");

    // If cache input is false, skip restoring cache
    if (!cache) {
      core.info("Cache not requested, not restoring cache");
      return;
    }

    // Restore the RPC cache
    await restoreRPCCache();
  } catch (err) {
    core.setFailed(err);
  }
}

module.exports = main;

if (require.main === module) {
  main();
}
