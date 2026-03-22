import { useIntl } from 'react-intl';
import { FC, MouseEvent } from 'react';
import {
  GroupWorkOutlined,
  LocationOnOutlined,
  WatchLaterOutlined,
} from '@mui/icons-material';

import MyActivityListItem from 'features/my/components/MyActivityListItem';
import { useMessages } from 'core/i18n';
import messageIds from '../l10n/messageIds';
import { ZetkinEventWithStatus } from '../types';
import { removeOffset } from 'utils/dateUtils';
import { timeSpanToString } from 'zui/utils/timeSpanString';
import { EventSignupButton } from './EventSignupButton';
import { EventImageCropSettings } from 'utils/types/zetkin';
import { cropToStyle } from 'utils/cropUtils';

type Props = {
  cropContext?: keyof EventImageCropSettings;
  event: ZetkinEventWithStatus;
  href?: string;
  onClickSignUp?: (ev: MouseEvent) => void;
};

const EventListItem: FC<Props> = ({
  cropContext = 'eventListItem',
  event,
  href,
  onClickSignUp,
}) => {
  const intl = useIntl();
  const messages = useMessages(messageIds);

  const actions = [
    <EventSignupButton
      key="signup"
      event={event}
      onClickSignUp={onClickSignUp}
    />,
  ];

  const cropSetting = event.cover_file_crop?.[cropContext];
  const imageCropStyle = cropSetting ? cropToStyle(cropSetting) : undefined;

  return (
    <MyActivityListItem
      actions={actions}
      href={href}
      image={event.cover_file?.url}
      imageCropStyle={imageCropStyle}
      info={[
        {
          Icon: GroupWorkOutlined,
          labels: [
            event.campaign && {
              href: `/o/${event.organization.id}/projects/${event.campaign.id}`,
              text: event.campaign.title,
            },
            {
              href: `/o/${event.organization.id}`,
              text: event.organization.title,
            },
          ].filter((label) => !!label),
        },
        {
          Icon: WatchLaterOutlined,
          labels: [
            timeSpanToString(
              new Date(removeOffset(event.start_time)),
              new Date(removeOffset(event.end_time)),
              intl
            ),
          ],
        },
        {
          Icon: LocationOnOutlined,
          labels: [
            event.location?.title || messages.defaultTitles.noLocation(),
          ],
        },
      ]}
      title={
        event.title || event.activity?.title || messages.defaultTitles.event()
      }
    />
  );
};

export default EventListItem;
