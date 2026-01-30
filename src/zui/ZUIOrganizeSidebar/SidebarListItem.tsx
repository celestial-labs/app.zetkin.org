import { cloneElement, forwardRef } from 'react';
import {
  IconProps,
  ListItemButton,
  ListItemIcon,
  Typography,
  useTheme,
} from '@mui/material';

import messageIds from '../l10n/messageIds';
import { useMessages } from 'core/i18n';

export type SidebarMessageKey =
  | 'people'
  | 'projects'
  | 'journeys'
  | 'geography'
  | 'search'
  | 'settings'
  | 'tags'
  | 'overview';

export interface SidebarListItemProps {
  icon: JSX.Element;
  name?: SidebarMessageKey;
  label?: string;
  open: boolean;
  selected?: boolean;
  onClick?: () => void;
}

const SidebarListItem = forwardRef<HTMLDivElement, SidebarListItemProps>(
  ({ icon, label, name, onClick, open, selected, ...restProps }, ref) => {
    const theme = useTheme();
    const messages = useMessages(messageIds);

    const sizedIcon = cloneElement<IconProps>(icon, {
      // Differentiate size of icon for open/closed states
      fontSize: open ? 'small' : 'medium',
    });

    const labelText =
      label || (name && messages.organizeSidebar[name]()) || '';

    return (
      <ListItemButton
        ref={ref}
        disableGutters
        onClick={onClick}
        sx={{
          '&:hover': {
            background: theme.palette.grey[100],
            pointer: 'cursor',
          },
          backgroundColor: selected ? theme.palette.grey[200] : 'transparent',
          borderRadius: '3px',
          my: 0.5,
          py: open ? 1.25 : 1.5,
          transition: theme.transitions.create(
            ['padding-top', 'padding-bottom', 'background-color'],
            {
              duration: theme.transitions.duration.leavingScreen,
              easing: theme.transitions.easing.sharp,
            }
          ),
        }}
        {...restProps}
      >
        <ListItemIcon
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '48px',
            width: '48px',
          }}
        >
          {sizedIcon}
        </ListItemIcon>
        <Typography
          sx={{
            alignItems: 'center',
            display: open ? 'block' : 'none',
            fontWeight: selected ? 700 : 'normal',
          }}
        >
          {labelText}
        </Typography>
      </ListItemButton>
    );
  }
);

SidebarListItem.displayName = 'SidebarListItem';

export default SidebarListItem;
