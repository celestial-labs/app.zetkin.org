import Cropper from 'react-easy-crop';
import { Area, Point } from 'react-easy-crop';
import { FC, useCallback, useState } from 'react';
import { Box, Button, CircularProgress, Slider, Typography } from '@mui/material';

import messageIds from 'features/files/l10n/messageIds';
import { Msg, useMessages } from 'core/i18n';
import { useAppDispatch } from 'core/hooks';
import { fileUploaded } from 'features/files/store';
import ZUIToggleButton from 'zui/components/ZUIToggleButton';
import { ZetkinFile } from 'utils/types/zetkin';

type Preset = 'public' | 'list' | 'calendar';

const PRESET_ASPECTS: Record<Preset, number> = {
  calendar: 4,
  list: 2,
  public: 2,
};

const PRESET_ORDER: Preset[] = ['public', 'list', 'calendar'];

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = new window.Image();
  image.crossOrigin = 'anonymous';
  image.src = imageSrc;
  await new Promise<void>((resolve) => {
    image.onload = () => resolve();
  });
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
      'image/jpeg',
      0.9
    );
  });
}

type Props = {
  file: ZetkinFile;
  onBack: () => void;
  onSelect: (file: ZetkinFile) => void;
  orgId: number;
};

const FilePreview: FC<Props> = ({ file, onBack, onSelect, orgId }) => {
  const dispatch = useAppDispatch();
  const messages = useMessages(messageIds);

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [activePreset, setActivePreset] = useState<Preset>('public');
  const [uploading, setUploading] = useState(false);

  const aspect = PRESET_ASPECTS[activePreset];

  const handleCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handlePresetChange = (value: string) => {
    if (value && value in PRESET_ASPECTS) {
      setActivePreset(value as Preset);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) {
      return;
    }
    setUploading(true);
    try {
      const blob = await getCroppedImg(file.url, croppedAreaPixels);
      const formData = new FormData();
      formData.append('file', blob, 'cropped.jpg');
      const res = await fetch(`/api/orgs/${orgId}/files`, {
        body: formData,
        method: 'POST',
      });
      const json = await res.json();
      const croppedFile = json.data as ZetkinFile;
      dispatch(fileUploaded(croppedFile));
      onSelect(croppedFile);
    } finally {
      setUploading(false);
    }
  };

  const presetLabels: Record<Preset, string> = {
    calendar: messages.libraryDialog.preview.cropFormats.calendar(),
    list: messages.libraryDialog.preview.cropFormats.list(),
    public: messages.libraryDialog.preview.cropFormats.public(),
  };

  const toggleOptions = PRESET_ORDER.map((key) => ({
    label: presetLabels[key],
    value: key,
  }));

  return (
    <Box display="flex" flexDirection="column" gap={1} height="100%">
      {/* Format selector */}
      <Box display="flex" justifyContent="center">
        <ZUIToggleButton
          onChange={handlePresetChange}
          options={toggleOptions}
          size="small"
          value={activePreset}
        />
      </Box>

      {/* Cropper — position:relative + fixed height is required by react-easy-crop */}
      <Box
        sx={{
          borderRadius: 1,
          flexGrow: 1,
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Cropper
          aspect={aspect}
          crop={crop}
          image={file.url}
          onCropChange={setCrop}
          onCropComplete={handleCropComplete}
          onZoomChange={setZoom}
          zoom={zoom}
        />
      </Box>

      {/* Zoom slider */}
      <Box px={2}>
        <Typography color="text.secondary" variant="body2">
          {messages.libraryDialog.preview.zoom()}
        </Typography>
        <Slider
          max={3}
          min={1}
          onChange={(_, value) => setZoom(value as number)}
          step={0.1}
          value={zoom}
        />
      </Box>

      {/* File info */}
      <Typography color="secondary" textAlign="center" variant="body2">
        {file.original_name}
      </Typography>

      {/* Action buttons */}
      <Box display="flex" gap={1} justifyContent="flex-end">
        <Button onClick={() => onBack()} variant="outlined">
          <Msg id={messageIds.libraryDialog.preview.backButton} />
        </Button>
        <Button
          data-testid="FileLibraryDialog-useButton"
          disabled={uploading || !croppedAreaPixels}
          onClick={handleSave}
          startIcon={uploading ? <CircularProgress size={16} /> : undefined}
          variant="contained"
        >
          <Msg id={messageIds.libraryDialog.preview.saveButton} />
        </Button>
      </Box>
    </Box>
  );
};

export default FilePreview;
