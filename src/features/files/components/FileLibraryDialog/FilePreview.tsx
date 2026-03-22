import { FC, useState } from 'react';
import Cropper, { Area, MediaSize } from 'react-easy-crop';
import {
  Box,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

import messageIds from 'features/files/l10n/messageIds';
import { Msg } from 'core/i18n';
import TransparentGridBackground from '../TransparentGridBackground';
import { ZetkinFile } from 'utils/types/zetkin';

type ViewContext = 'default' | 'eventListItem' | 'publicEventPage' | 'orgEventPage';

type CropState = {
  crop: { x: number; y: number };
  zoom: number;
};

type ContextConfig = {
  label: string;
  width: number;
  height: number;
};

const VIEW_CONTEXTS: Record<Exclude<ViewContext, 'default'>, ContextConfig> = {
  eventListItem: {
    height: 150,
    label: 'my/feed: EventListItem',
    width: 942,
  },
  orgEventPage: {
    height: 150,
    label: 'o/[orgId]: PublicEventPage',
    width: 462,
  },
  publicEventPage: {
    height: 450,
    label: 'o/[eventId]/events: PublicEventPage',
    width: 960,
  },
};

const DEFAULT_CROP_STATE: CropState = { crop: { x: 0, y: 0 }, zoom: 1 };

type Props = {
  file: ZetkinFile;
  onBack: () => void;
  onSelect: () => void;
};

const FilePreview: FC<Props> = ({ file, onBack, onSelect }) => {
  const [dimensions, setDimensions] = useState({ height: 0, width: 0 });
  const [activeContext, setActiveContext] = useState<ViewContext>('default');
  const [contextStates, setContextStates] = useState<
    Record<Exclude<ViewContext, 'default'>, CropState>
  >({
    eventListItem: { ...DEFAULT_CROP_STATE },
    orgEventPage: { ...DEFAULT_CROP_STATE },
    publicEventPage: { ...DEFAULT_CROP_STATE },
  });

  const isDefault = activeContext === 'default';
  const currentState = isDefault
    ? DEFAULT_CROP_STATE
    : contextStates[activeContext];
  const aspectRatio = isDefault
    ? undefined
    : VIEW_CONTEXTS[activeContext].width / VIEW_CONTEXTS[activeContext].height;

  const handleContextChange = (
    _: React.MouseEvent<HTMLElement>,
    newContext: ViewContext | null
  ) => {
    if (newContext !== null) {
      setActiveContext(newContext);
    }
  };

  const handleCropChange = (crop: { x: number; y: number }) => {
    if (!isDefault) {
      setContextStates((prev) => ({
        ...prev,
        [activeContext]: { ...prev[activeContext as Exclude<ViewContext, 'default'>], crop },
      }));
    }
  };

  const handleZoomChange = (zoom: number) => {
    if (!isDefault) {
      setContextStates((prev) => ({
        ...prev,
        [activeContext]: { ...prev[activeContext as Exclude<ViewContext, 'default'>], zoom },
      }));
    }
  };

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Box display="flex" justifyContent="center" mb={1} mt={1}>
        <ToggleButtonGroup
          exclusive
          onChange={handleContextChange}
          size="small"
          value={activeContext}
        >
          <ToggleButton value="default">Default</ToggleButton>
          {(
            Object.entries(VIEW_CONTEXTS) as [
              Exclude<ViewContext, 'default'>,
              ContextConfig,
            ][]
          ).map(([key, ctx]) => (
            <ToggleButton key={key} value={key}>
              {ctx.label}
              <Typography
                component="span"
                sx={{ color: 'text.secondary', fontSize: '0.65rem', ml: 0.5 }}
              >
                {ctx.width}×{ctx.height}
              </Typography>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Box height="100%" my={2} overflow="auto">
        <TransparentGridBackground
          interactive={false}
          sx={{
            height: 'calc(100% - 4em)',
            position: 'relative',
          }}
        >
          {isDefault ? (
            <Box
              alt={file.original_name}
              component="img"
              src={file.url}
              sx={{
                height: '100%',
                objectFit: 'contain',
                width: '100%',
              }}
            />
          ) : (
            <Cropper
              key={activeContext}
              aspect={aspectRatio}
              crop={currentState.crop}
              image={file.url}
              onCropChange={handleCropChange}
              onCropComplete={(_croppedArea: Area, _croppedAreaPixels: Area) => {}}
              onMediaLoaded={(mediaSize: MediaSize) => {
                setDimensions({
                  height: mediaSize.naturalHeight,
                  width: mediaSize.naturalWidth,
                });
              }}
              onZoomChange={handleZoomChange}
              zoom={currentState.zoom}
            />
          )}
        </TransparentGridBackground>
        <Typography color="secondary" mt={1} textAlign="center" variant="body2">
          {file.original_name}
        </Typography>
        <Typography color="secondary" mt={1} textAlign="center" variant="body2">
          <Msg
            id={messageIds.image.dimensions}
            values={{ height: dimensions.height, width: dimensions.width }}
          />
        </Typography>
      </Box>
      <Box display="flex" gap={1} justifyContent="flex-end">
        <Button onClick={() => onBack()} variant="outlined">
          <Msg id={messageIds.libraryDialog.preview.backButton} />
        </Button>
        <Button
          data-testid="FileLibraryDialog-useButton"
          onClick={() => onSelect()}
          variant="contained"
        >
          <Msg id={messageIds.libraryDialog.preview.useButton} />
        </Button>
      </Box>
    </Box>
  );
};

export default FilePreview;
