var Promise = require('bluebird'),
  _ = require('lodash'),
  AWS = require('aws-sdk');

module.exports = function (region, deliveryStreamName) {
  if (!region || !deliveryStreamName) {
    throw new Error('region and deliveryStreamName are required');
  }

  AWS.config.update({ region: region });
  var firehose = new AWS.Firehose();
  Promise.promisifyAll(Object.getPrototypeOf(firehose));

  var store = {
    saveItems: function (items) {
      var records = store._setupRecords(items),
        totalRecords = records.length,
        recordsBatches = _.chunk(records, 500),
        totalBatches = recordsBatches.length;

      var promises = recordsBatches.map(function (batch) {
        return store._saveRecords(batch);
      });

      return Promise.all(promises)
        .then(function () {
          return totalRecords;
        });
    },

    _setupRecords: function (comments) {
      var records = comments.map(function (comment) {
        var data = JSON.stringify(comment) + '\n';

        return { Data: data };
      });

      return records;
    },

    _saveRecords: function (records, retryCount) {
      var rCount = retryCount || 0,
        params = {
          DeliveryStreamName: deliveryStreamName,
          Records: records
        };

      return firehose.putRecordBatchAsync(params)
        .then(function (writeResults) {
          return store._validateRecordsSaveResults(records, writeResults, rCount);
        });
    },

    _validateRecordsSaveResults: function (records, writeResults, retryCount) {
      if (!writeResults.length || writeResults.FailedPutCount == 0 || retryCount > 2) {
        return writeResults;
      }

      var failedRecords = [];
      retryCount++;

      writeResults.forEach(function (result, index) {
        if (result.ErrorCode) {
          console.log('Record save failed. Retrying', result.ErrorMessage);
          failedRecords.push(records[index]);
        }
      });

      return Promise.delay(500)
        .then(function () {
          return store._saveRecords(records, retryCount);
        });
    }
  };

  return store;
};
