import { useTheme } from 'next-themes';

export function useColorMode(): {
  colorMode: 'light' | 'dark';
  toggleColorMode: () => void;
} {
  const { resolvedTheme, setTheme } = useTheme();
  const colorMode: 'light' | 'dark' = resolvedTheme === 'dark' ? 'dark' : 'light';
  const toggleColorMode = () => setTheme(colorMode === 'light' ? 'dark' : 'light');
  return { colorMode, toggleColorMode };
}
