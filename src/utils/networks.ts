function loadNetworks() {
  const networksFile =
    process.env['npm_config_networks_file'] ||
    process.argv
      .find((arg) => arg.includes('--networks-file'))
      ?.split('--networks-file')
      ?.pop();

  if (networksFile === undefined) {
    return require('@snapshot-labs/snapshot.js/src/networks.json');
  } else {
    try {
      return require(networksFile);
    } catch (e) {
      throw new Error('Cannot find networks file: ' + networksFile);
    }
  }
}

const networks = loadNetworks();

module.exports = networks;
