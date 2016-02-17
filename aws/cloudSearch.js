var Promise = require('bluebird'),
  _ = require('lodash'),
  AWS = require('aws-sdk');

module.exports = function (region, endpoint) {
  if (!region || !endpoint) {
    throw new Error('region and endpoint are required');
  }

  AWS.config.update({ region: region });
  var csd = new AWS.CloudSearchDomain({ endpoint: endpoint });
  Promise.promisifyAll(Object.getPrototypeOf(csd));

  var searchEngine = {
    exportItems: function (items) {
      var chunks = _.chunk(items, 5000),
        promises = chunks.map(searchEngine._exportChunk);

      return Promise.all(promises);
    },

    _exportChunk: function (items) {
      var options = {
        contentType: 'application/json',
        documents: JSON.stringify(items)
      }

      return csd.uploadDocumentsAsync(options);
    }
  };

  return searchEngine
};