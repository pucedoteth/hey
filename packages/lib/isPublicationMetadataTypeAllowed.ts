const allowedTypes = [
  'ArticleMetadataV3',
  'AudioMetadataV3',
  'ImageMetadataV3',
  'TextOnlyMetadataV3',
  'VideoMetadataV3',
  'MintMetadataV3',
  'EmbedMetadataV3',
  'LiveStreamMetadataV3'
];

const isPublicationMetadataTypeAllowed = (type?: string): boolean => {
  if (!type) {
    return false;
  }

  return allowedTypes.includes(type);
};

export default isPublicationMetadataTypeAllowed;
