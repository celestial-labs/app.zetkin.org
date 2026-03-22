import { ReactElement } from 'react';

export interface SidebarItem {
  name: string;
  label: string;
  href: string;
  icon: ReactElement;
}

export interface Plugin {
  id: string;
  name: string;
  slots?: {
    sidebar?: SidebarItem[];
  };
}
