var Promise = require('bluebird'),
  AWS = require('aws-sdk');

module.exports = function (region) {
  if (!region) {
    throw new Error('region is required');
  }

  AWS.config.update({ region: region });
  var s3 = new AWS.S3();
  Promise.promisifyAll(Object.getPrototypeOf(s3));

  var fileStore = {
    getFile: function (bucketName, key) {
      var options = {
        Bucket: bucketName,
        Key: key
      };

      return s3.getObjectAsync(options);
    },

    saveFile: function (bucketName, key, content) {
      var options = {
        Bucket: bucketName,
        Key: key,
        Body: content
      };

      return s3.uploadAsync(options);
    },

    listFilesInBucket: function (bucketName, prefix) {
      var options = {
        Bucket: bucketName,
        Prefix: prefix
      };

      return s3.listObjectsAsync(options);
    }
  };

  return fileStore;
};