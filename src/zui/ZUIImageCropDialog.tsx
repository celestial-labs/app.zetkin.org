import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Area, Point } from 'react-easy-crop';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Typography,
} from '@mui/material';

import { useAppDispatch } from 'core/hooks';
import { useMessages } from 'core/i18n';
import { fileUploaded } from 'features/files/store';
import ZUIToggleButton from './components/ZUIToggleButton';
import messageIds from './l10n/messageIds';
import { ZetkinFile } from 'utils/types/zetkin';

type Preset = 'public' | 'list' | 'calendar';

const PRESET_ASPECTS: Record<Preset, number> = {
  calendar: 4,
  list: 2,
  public: 2,
};

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

interface ZUIImageCropDialogProps {
  imageUrl: string;
  onClose: () => void;
  onCropComplete: (file: ZetkinFile) => void;
  open: boolean;
  orgId: number;
}

const ZUIImageCropDialog: React.FC<ZUIImageCropDialogProps> = ({
  imageUrl,
  onClose,
  onCropComplete,
  open,
  orgId,
}) => {
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
      const blob = await getCroppedImg(imageUrl, croppedAreaPixels);
      const formData = new FormData();
      formData.append('file', blob, 'cropped.jpg');
      const res = await fetch(`/api/orgs/${orgId}/files`, {
        body: formData,
        method: 'POST',
      });
      const json = await res.json();
      const zetkinFile = json.data as ZetkinFile;
      dispatch(fileUploaded(zetkinFile));
      onCropComplete(zetkinFile);
    } finally {
      setUploading(false);
    }
  };

  const presetLabels: Record<Preset, string> = {
    calendar: messages.editableImage.cropDialog.presets.calendar(),
    list: messages.editableImage.cropDialog.presets.list(),
    public: messages.editableImage.cropDialog.presets.public(),
  };

  const toggleOptions = (Object.keys(PRESET_ASPECTS) as Preset[]).map(
    (key) => ({ label: presetLabels[key], value: key })
  );

  const presetOrder: Preset[] = ['public', 'list', 'calendar'];

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle>{messages.editableImage.cropDialog.title()}</DialogTitle>
      <DialogContent sx={{ pb: 1 }}>
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Preset format buttons */}
          <ZUIToggleButton
            onChange={handlePresetChange}
            options={toggleOptions}
            size="small"
            value={activePreset}
          />

          {/* Format preview strip */}
          <Box
            sx={{
              alignItems: 'flex-end',
              display: 'flex',
              gap: 3,
              justifyContent: 'center',
            }}
          >
            {presetOrder.map((key) => (
              <Box
                key={key}
                onClick={() => handlePresetChange(key)}
                sx={{
                  alignItems: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  opacity: activePreset === key ? 1 : 0.4,
                  transition: 'opacity 0.2s',
                }}
              >
                <Box
                  sx={(theme) => ({
                    backgroundColor:
                      activePreset === key
                        ? theme.palette.primary.main
                        : theme.palette.grey[400],
                    borderRadius: 0.5,
                    height: 48 / PRESET_ASPECTS[key],
                    transition: 'background-color 0.2s',
                    width: 48,
                  })}
                />
                <Typography variant="caption">{presetLabels[key]}</Typography>
              </Box>
            ))}
          </Box>

          {/* Cropper */}
          <Box
            sx={{
              borderRadius: 1,
              height: 400,
              overflow: 'hidden',
              position: 'relative',
              width: '100%',
            }}
          >
            {imageUrl && (
              <Cropper
                aspect={aspect}
                crop={crop}
                image={imageUrl}
                onCropChange={setCrop}
                onCropComplete={handleCropComplete}
                onZoomChange={setZoom}
                zoom={zoom}
              />
            )}
          </Box>

          {/* Zoom slider */}
          <Box sx={{ px: 2, width: '100%' }}>
            <Typography gutterBottom color="text.secondary" variant="body2">
              {messages.editableImage.cropDialog.zoom()}
            </Typography>
            <Slider
              max={3}
              min={1}
              onChange={(_, value) => setZoom(value as number)}
              step={0.1}
              value={zoom}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {messages.editableImage.cropDialog.cancel()}
        </Button>
        <Button
          disabled={uploading || !croppedAreaPixels}
          onClick={handleSave}
          startIcon={uploading ? <CircularProgress size={16} /> : undefined}
          variant="contained"
        >
          {uploading ? (
            <CircularProgress size={16} />
          ) : (
            messages.editableImage.cropDialog.saveButton()
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ZUIImageCropDialog;
