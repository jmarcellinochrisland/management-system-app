import { StatusBar, StatusBarProps } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

export type AppStatusBarProps = StatusBarProps;

/**
 * Komponen Status Bar (Baterai, Sinyal, Jam).
 * Anda bisa memanggil <AppStatusBar /> di file baru mana pun jika diinginkan.
 */
export function AppStatusBar({ style, hidden = false, ...props }: AppStatusBarProps) {
  const colorScheme = useColorScheme();
  const activeStyle = style || (colorScheme === 'dark' ? 'light' : 'dark');

  return <StatusBar style={activeStyle} hidden={hidden} {...props} />;
}

export default AppStatusBar;
