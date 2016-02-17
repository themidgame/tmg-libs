# tmg-libs #

Contains a set of tools used at themidgame to retrieve, process and store data.

## AWS ##
### S3 ###

```
var s3 = tmg-libs.aws.s3(awsRegion);

// download file
s3.getFile(bucketName, key);

// upload file
s3.saveFile(bucketName, key, content);

// list files
s3.listFilesInBucket(bucketName, prefix);
```

### SQS ###

```
var sqs = tmg-libs.aws.sqs(awsRegion, queueUrl);

// send notification
sqs.notify(jsonMessageObject);
```

### DynamoDB ###

```
var dynamo = tmg-libs.aws.dynamo(awsRegion, tableName);

// get items
dynamo.getItemsByPartitionKey(partitionKeyName, partitionKeyValue);

// save items
dynamo.saveItems(items);

// save item
dynamo.saveItem(item);
```

### CloudSearch ###

```
var cloudSearch = tmg-libs.aws.cloudSearch(awsRegion, cloudSearchEndpoint);

// export items to index
cloudSearch.exportItems(items);
```

## YouTube ##
### Video ###

```
var Video = tmg-libs.youtube.video;
var video = new Video(videoId, apiKey);

// get video information
video.getInformation();

// get comments
video.comments.getAll();
```

### Channel ###

```
var Channel = tmg-libs.youtube.channel;
var channel = new Channel(channelId, apiKey);

// get channel information
channel.getInformation();

// get uploads playlist id
channel.getUploadsPlaylistId();

// get playlist items
channel.getPlaylistItems(playlistId);

// get videoIds from playlist
channel.getVideoIdsFromPlaylist(playlistId);
```