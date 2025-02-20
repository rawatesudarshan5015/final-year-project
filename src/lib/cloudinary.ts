import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(file: Buffer, folder: string = 'general') {
  try {
    console.log('Starting Cloudinary upload to folder:', folder);
    
    // Convert buffer to base64
    const b64 = Buffer.from(file).toString('base64');
    
    // Detect file type from buffer header
    const fileType = detectFileType(file);
    console.log('File type detection:', fileType);
    
    // Construct appropriate data URI
    const dataURI = `data:${fileType.mimeType};base64,${b64}`;
    
    // Upload to Cloudinary with optimized settings
    console.log('Uploading to Cloudinary with config:', {
      folder,
      resource_type: fileType.resourceType,
      chunk_size: 6000000,
      timeout: 120000
    });

    const result = await cloudinary.uploader.upload(dataURI, {
      folder,
      resource_type: fileType.resourceType,
      chunk_size: 6000000, // 6MB chunks for videos
      timeout: 120000, // 2 minutes timeout for larger files
      overwrite: true,
      invalidate: true,
    });

    console.log('Cloudinary upload successful:', {
      public_id: result.public_id,
      url: result.secure_url,
      resource_type: result.resource_type
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    throw new Error(error instanceof Error ? error.message : 'Failed to upload file to Cloudinary');
  }
}

function detectFileType(buffer: Buffer): { mimeType: string; resourceType: 'image' | 'video' | 'auto' } {
  // Check for common file signatures
  const header = buffer.slice(0, 4).toString('hex');
  
  // Image signatures
  if (header.startsWith('89504e47')) return { mimeType: 'image/png', resourceType: 'image' };
  if (header.startsWith('ffd8')) return { mimeType: 'image/jpeg', resourceType: 'image' };
  if (header.startsWith('47494638')) return { mimeType: 'image/gif', resourceType: 'image' };
  
  // Video signatures
  if (header.startsWith('000001') || header.startsWith('ftyp')) {
    return { mimeType: 'video/mp4', resourceType: 'video' };
  }
  
  // Default to auto if unknown
  return { mimeType: 'application/octet-stream', resourceType: 'auto' };
}

export async function deleteFromCloudinary(publicId: string) {
  try {
    console.log('Deleting file from Cloudinary:', publicId);
    await cloudinary.uploader.destroy(publicId);
    console.log('Successfully deleted file from Cloudinary:', publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    throw new Error('Failed to delete file from Cloudinary');
  }
} 