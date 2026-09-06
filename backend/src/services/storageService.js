const fs = require('fs');
const path = require('path');

// Storage Interface
class StorageProvider {
  async saveFile(fileBuffer, filename, mimeType) {
    throw new Error('saveFile method must be implemented');
  }
  async getFileUrl(filename) {
    throw new Error('getFileUrl method must be implemented');
  }
  async deleteFile(filename) {
    throw new Error('deleteFile method must be implemented');
  }
}

// Local Disk Provider
class LocalStorageProvider extends StorageProvider {
  constructor(uploadDir) {
    super();
    this.uploadDir = uploadDir || path.join(__dirname, '../../uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(fileBuffer, filename) {
    const filePath = path.join(this.uploadDir, filename);
    await fs.promises.writeFile(filePath, fileBuffer);
    return `/uploads/${filename}`;
  }

  async getFileUrl(filename) {
    return `/uploads/${filename}`;
  }

  async deleteFile(filename) {
    const filePath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    return true;
  }
}

// S3 Storage Provider (Stub - ready to swap in with AWS SDK)
class S3StorageProvider extends StorageProvider {
  constructor(config = {}) {
    super();
    this.bucket = config.bucket || process.env.AWS_S3_BUCKET;
    this.region = config.region || process.env.AWS_REGION || 'ap-south-1';
  }

  async saveFile(fileBuffer, filename, mimeType) {
    console.log(`[S3 Storage Stub] Uploading ${filename} to bucket ${this.bucket}`);
    // In production: await s3.putObject({ Bucket: this.bucket, Key: filename, Body: fileBuffer, ContentType: mimeType }).promise();
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${filename}`;
  }

  async getFileUrl(filename) {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${filename}`;
  }

  async deleteFile(filename) {
    console.log(`[S3 Storage Stub] Deleting ${filename} from bucket ${this.bucket}`);
    return true;
  }
}

// Factory to get active storage provider based on environment
const getStorageProvider = () => {
  const providerType = process.env.STORAGE_PROVIDER || 'local';
  if (providerType === 's3') {
    return new S3StorageProvider();
  }
  return new LocalStorageProvider();
};

module.exports = {
  StorageProvider,
  LocalStorageProvider,
  S3StorageProvider,
  storage: getStorageProvider(),
};
