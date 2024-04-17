const AWS = require('aws-sdk');

class S3BucketRepository {
  constructor(opts) {
    this.logger = opts.logger;

    this.bucketName = opts.bucketName;

    this.logger.trace('configure AWS client');
    AWS.config.update({
      accessKeyId: opts.awsAccessKeyId,
      secretAccessKey: opts.awsSecretAccessKey,
      region: opts.awsBucketRegion,
    });

    this.logger.trace('setup bucket client');
    this.client = new AWS.S3();
  }

  async upload(key, data) {
    this.logger.trace(`uploading to bucket as ${key}`);

    const details = await this.client.upload({
      Bucket: this.bucketName,
      Body : JSON.stringify(data),
      Key : key
    }).promise();

    this.logger.trace(details, 'upload complete');
  }

  async download(key) {
    this.logger.trace(`downloading from bucket as ${key}`);

    const blob = await this.client.getObject({
      Bucket: this.bucketName,
      Key : key,
    }).promise();

    this.logger.trace('download complete');

    return JSON.parse(blob.Body.toString('utf-8'));
  }
}

module.exports = S3BucketRepository;
