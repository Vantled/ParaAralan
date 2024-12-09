const IMGUR_CLIENT_ID = process.env.REACT_APP_IMGUR_CLIENT_ID;
export const DEFAULT_AVATAR_URL = 'https://www.gravatar.com/avatar/default?s=200&d=mp';

if (!IMGUR_CLIENT_ID) {
  console.error('Missing Imgur Client ID! Please check your environment variables.');
}

// Function to compress image before upload
const compressImage = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Reduce maximum dimensions
        const MAX_WIDTH = 400;  // Reduced from 800
        const MAX_HEIGHT = 400; // Reduced from 800

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }));
          },
          'image/jpeg',
          0.6  // Reduced quality to 60%
        );
      };
    };
  });
};

export const uploadToImgur = async (file) => {
  if (!IMGUR_CLIENT_ID) {
    return DEFAULT_AVATAR_URL;
  }

  try {
    const compressedFile = await compressImage(file);
    const formData = new FormData();
    formData.append('image', compressedFile);

    const response = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return data.data.link;
    } else {
      throw new Error(data.data.error || 'Failed to upload image');
    }
  } catch (error) {
    console.error('Imgur upload error:', error);
    return DEFAULT_AVATAR_URL;
  }
}; 