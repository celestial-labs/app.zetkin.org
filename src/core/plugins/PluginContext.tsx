import { createContext, FC, PropsWithChildren, useContext } from 'react';
import { PluginManager } from './PluginManager';

const PluginContext = createContext<PluginManager | null>(null);

type PluginProviderProps = PropsWithChildren & {
  pluginManager: PluginManager;
};

export const PluginProvider: FC<PluginProviderProps> = ({
  children,
  pluginManager,
}) => {
  return (
    <PluginContext.Provider value={pluginManager}>
      {children}
    </PluginContext.Provider>
  );
};

export const usePlugins = () => {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error('usePlugins must be used within a PluginProvider');
  }
  return context;
};
