import { FC, useState } from 'react';
import Cropper, { Area, MediaSize } from 'react-easy-crop';
import { Box, Button, Typography } from '@mui/material';

import messageIds from 'features/files/l10n/messageIds';
import { Msg } from 'core/i18n';
import TransparentGridBackground from '../TransparentGridBackground';
import { ZetkinFile } from 'utils/types/zetkin';

type Props = {
  file: ZetkinFile;
  onBack: () => void;
  onSelect: () => void;
};

const FilePreview: FC<Props> = ({ file, onBack, onSelect }) => {
  const [dimensions, setDimensions] = useState({ height: 0, width: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Box height="100%" my={2} overflow="auto">
        <TransparentGridBackground
          interactive={false}
          sx={{
            height: 'calc(100% - 4em)',
            position: 'relative',
          }}
        >
          <Cropper
            crop={crop}
            image={file.url}
            onCropChange={setCrop}
            onCropComplete={(_croppedArea: Area, _croppedAreaPixels: Area) => {}}
            onMediaLoaded={(mediaSize: MediaSize) => {
              setDimensions({
                height: mediaSize.naturalHeight,
                width: mediaSize.naturalWidth,
              });
            }}
            onZoomChange={setZoom}
            zoom={zoom}
          />
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
