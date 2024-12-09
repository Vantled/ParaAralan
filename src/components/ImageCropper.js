import React, { useState } from 'react';
import Cropper from 'react-easy-crop';

const ImageCropper = ({ image, onCropComplete, onCancel, aspect = 1 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleApplyCrop = () => {
    onCropComplete(croppedAreaPixels);
  };

  return (
    <div className="image-cropper-container">
      <div className="cropper-wrapper">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteHandler}
          objectFit="contain"
          showGrid={true}
          cropShape="round"
        />
      </div>
      <div className="cropper-controls">
        <div className="zoom-controls">
          <span>Zoom</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => {
              setZoom(parseFloat(e.target.value));
            }}
            className="zoom-slider"
          />
        </div>
        <div className="cropper-buttons">
          <button onClick={onCancel} className="cancel-crop-button">
            Cancel
          </button>
          <button 
            onClick={handleApplyCrop}
            className="apply-crop-button"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper; 