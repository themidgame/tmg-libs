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
    exportItems: function (items, chunkSize) {
      var chunks = _.chunk(items, chunkSize);
      return searchEngine._exportChunks(chunks);
    },

    _exportChunks: function (chunks) {
      var workingChunks = chunks.slice();
      return searchEngine._exportChunksInChain(workingChunks);
    },

    _exportChunksInChain: function (chunks) {
      if (!chunks.length) {
        return null;
      }

      return searchEngine._exportSingleChunk(chunks.pop())
        .then(function () {
          return searchEngine._exportChunksInChain(chunks);
        });
    },

    _exportSingleChunk: function (items) {
      var options = {
        contentType: 'application/json',
        documents: JSON.stringify(items)
      }

      return csd.uploadDocumentsAsync(options);
    }
  };

  return searchEngine
};
