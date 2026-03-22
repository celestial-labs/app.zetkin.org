import { Plugin, SidebarItem } from './types';

export class PluginManager {
  private plugins: Plugin[] = [];

  constructor() {
    this.register = this.register.bind(this);
    this.getSidebarItems = this.getSidebarItems.bind(this);
    this.getPlugins = this.getPlugins.bind(this);
  }

  register(plugin: Plugin) {
    this.plugins.push(plugin);
  }

  getSidebarItems(): SidebarItem[] {
    return this.plugins.flatMap((p) => p.slots?.sidebar || []);
  }

  getPlugins(): Plugin[] {
    return this.plugins;
  }
}

export const pluginManager = new PluginManager();
