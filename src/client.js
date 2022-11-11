/**
 * @typedef {Object} PromiseResponse
 * @property {Object} result
 * @property {Object} error
 */

/** Class for extension messaging client */
class ExtensionClient {
  /**
   * Create client
   * @params {string} extensionId The extension ID
   * @example
   * var extClient = new ExtensionClient('mjohdbbcalikedmakbinlbehocidcffn');
   */
  constructor(extensionId) {
    this.extensionId = extensionId;
  }

  /**
   * Say hello
   */
  hello(payload) {
    return new Promise((resolve, reject) => {
      console.log(name);
      chrome.runtime.sendMessage(
        this.extensionId,
        {
          action: 'hello',
          payload: JSON.stringify(payload),
        },
        function(result) {
          if (result.err) {
            reject(result.err);
          }
          resolve(result);
        },
      );
    });
  }
}

module.exports = ExtensionClient;
