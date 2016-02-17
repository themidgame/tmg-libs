var Promise = require('bluebird'),
  google = require('googleapis'),
  youtube = google.youtube('v3'),
  Paginator = require('./libs/paginator');

Promise.promisifyAll(youtube.channels);
Promise.promisifyAll(youtube.playlistItems);

function Channel(channelId, apiKey) {
  if (!channelId || !apiKey) {
      throw new Error('channelId and apiKey are required');
    }

  this.channelId = channelId;
  this.apiKey = apiKey;
  var channel = this;

  this.getInformation = function (part) {
    var options = {
      key: channel.apiKey,
      id: channel.channelId,
      part: part
    };

    return youtube.channels.listAsync(options)
      .then(function (response) {
        return response.items[0];
      });
  };

  this.getUploadsPlaylistId = function () {
    return channel.getInformation('contentDetails').then(function (channelInfo) {
      var uploadsPlaylistId = channelInfo.contentDetails.relatedPlaylists.uploads;
      return uploadsPlaylistId;
    });
  };

  this.getPlaylistItems = function (playlistId) {
    var options = {
      key: channel.apiKey,
      playlistId: playlistId,
      part: 'snippet',
      maxResults: 50
    };

    var paginator = new Paginator({
      endpoint: 'playlistItems.list',
      mergePages: true,
      params: options
    });

    return paginator.getAllPages()
      .then(function (response) {
        return response.items;
      });
  };

  this.getVideoIdsFromPlaylist = function (playlistId) {
    return channel.getPlaylistItems(playlistId)
      .then(channel._getVideoIdsFromPlaylistItems);
  };

  this._getVideoIdsFromPlaylistItems = function (playlistItems) {
    return playlistItems.map(function (playlistItem) {
      return playlistItem.snippet.resourceId.videoId;
    });
  };
}

module.exports = Channel;