import { PluginManager } from './PluginManager';

describe('PluginManager', () => {
  it('should register a plugin and retrieve sidebar items', () => {
    const manager = new PluginManager();
    const plugin = {
      id: 'test-plugin',
      name: 'Test Plugin',
      slots: {
        sidebar: [
          {
            href: '/test',
            icon: null as any, // Mocking ReactElement
            label: 'Test Item',
            name: 'test-item',
          },
        ],
      },
    };

    manager.register(plugin);

    const items = manager.getSidebarItems();
    expect(items).toHaveLength(1);
    expect(items[0].label).toBe('Test Item');
  });

  it('should return empty list if no plugins registered', () => {
    const manager = new PluginManager();
    expect(manager.getSidebarItems()).toHaveLength(0);
  });
});
