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

import ZUIToggleButton from './components/ZUIToggleButton';
import { ZetkinFile } from 'utils/types/zetkin';

type Preset = 'public' | 'list' | 'calendar';

const PRESETS: Record<Preset, { aspect: number; label: string }> = {
  calendar: { aspect: 4, label: 'Kalender-Vorschau' },
  list: { aspect: 2, label: 'Listenansicht' },
  public: { aspect: 2, label: 'Öffentliche Seite' },
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
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
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
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [activePreset, setActivePreset] = useState<Preset>('public');
  const [uploading, setUploading] = useState(false);

  const aspect = PRESETS[activePreset].aspect;

  const handleCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handlePresetChange = (value: string) => {
    if (value && value in PRESETS) {
      setActivePreset(value as Preset);
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
      onCropComplete(json.data as ZetkinFile);
    } finally {
      setUploading(false);
    }
  };

  const toggleOptions = [
    { label: PRESETS.public.label, value: 'public' },
    { label: PRESETS.list.label, value: 'list' },
    { label: PRESETS.calendar.label, value: 'calendar' },
  ];

  return (
    <Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
      <DialogTitle>Bild zuschneiden</DialogTitle>
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
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              width: '100%',
            }}
          >
            <Typography color="text.secondary" variant="body2">
              Format wählen
            </Typography>
            <ZUIToggleButton
              onChange={handlePresetChange}
              options={toggleOptions}
              size="small"
              value={activePreset}
            />
          </Box>

          {/* Format preview strip */}
          <Box
            sx={{
              alignItems: 'flex-end',
              display: 'flex',
              gap: 3,
              justifyContent: 'center',
              width: '100%',
            }}
          >
            {(Object.entries(PRESETS) as [Preset, { aspect: number; label: string }][]).map(
              ([key, preset]) => (
                <Box
                  key={key}
                  onClick={() => setActivePreset(key)}
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
                      height: 32 / preset.aspect,
                      transition: 'background-color 0.2s',
                      width: 64,
                    })}
                  />
                  <Typography variant="caption">{preset.label}</Typography>
                </Box>
              )
            )}
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
              Zoom
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
        <Button onClick={onClose}>Abbrechen</Button>
        <Button
          disabled={uploading || !croppedAreaPixels}
          onClick={handleSave}
          startIcon={uploading ? <CircularProgress size={16} /> : undefined}
          variant="contained"
        >
          {uploading ? 'Wird gespeichert…' : 'Zuschneiden & Speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ZUIImageCropDialog;
