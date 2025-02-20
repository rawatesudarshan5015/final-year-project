import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    console.log('Starting upload request processing');
    
    // Try to get token from Authorization header first
    const authHeader = request.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    // Then try to get token from cookie
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get('token');
    console.log('Cookie token present:', !!tokenCookie);

    let token = null;
    let userId = null;
    
    // Try Authorization header first
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log('Using token from Authorization header');
    }
    // Fall back to cookie
    else if (tokenCookie) {
      token = tokenCookie.value;
      console.log('Using token from cookie');
    }

    if (!token) {
      console.log('No valid token found in either header or cookie');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No valid token found' },
        { status: 401 }
      );
    }

    try {
      const user = verifyToken(token);
      userId = user.id;
      console.log('User authenticated:', userId);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Process the upload
    console.log('Parsing FormData from request');
    console.log('Content-Type:', request.headers.get('content-type'));
    
    const formData = await request.formData();
    
    // Log raw FormData information
    const formDataEntries = Array.from(formData.entries());
    console.log('FormData entries:', formDataEntries.map(entry => ({
      key: entry[0],
      value: entry[1] instanceof File 
        ? `File: ${entry[1].name} (${entry[1].type})`
        : String(entry[1]),
      isFile: entry[1] instanceof File
    })));

    const file = formData.get('file');
    const uploadType = formData.get('type');
    
    const isFile = (value: FormDataEntryValue | null): value is File => {
      return value instanceof File;
    };
    
    console.log('Parsed form values:', {
      file: isFile(file) ? {
        name: file.name,
        type: file.type,
        size: file.size
      } : 'not a file',
      uploadType: {
        value: uploadType,
        type: typeof uploadType
      }
    });

    // Validate file
    if (!isFile(file)) {
      console.log('File validation failed:', { 
        hasFile: !!file,
        type: file ? typeof file : 'undefined'
      });
      return NextResponse.json(
        { success: false, error: 'No valid file provided' },
        { status: 400 }
      );
    }

    // Validate type
    if (!uploadType || typeof uploadType !== 'string') {
      console.log('Type validation failed:', { 
        uploadType,
        type: typeof uploadType,
        formDataKeys: Array.from(formData.keys())
      });
      return NextResponse.json(
        { success: false, error: 'Upload type is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate upload type value
    if (!['profile', 'post'].includes(uploadType)) {
      console.log('Invalid upload type:', uploadType);
      return NextResponse.json(
        { success: false, error: `Invalid upload type: ${uploadType}` },
        { status: 400 }
      );
    }

    try {
      // Convert File to Buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      console.log('File converted to buffer:', {
        originalSize: file.size,
        bufferSize: buffer.length
      });
      
      // Upload to Cloudinary with appropriate folder
      const folder = `${uploadType}s/${userId}`; // Organize by type and user
      console.log('Uploading to Cloudinary:', {
        folder,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });
      
      const { url, public_id } = await uploadToCloudinary(buffer, folder);
      console.log('Cloudinary upload successful:', { url, public_id });

      return NextResponse.json({
        success: true,
        url,
        public_id,
      });
    } catch (error) {
      console.error('Upload processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 