import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import { system } from './theme';
import { ThemeProvider } from 'next-themes';
import './fonts.css';
import './index.css';
import App from './App';

export function Root() {
  return (
    <StrictMode>
      <ChakraProvider value={system}>
        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <App />
        </ThemeProvider>
      </ChakraProvider>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
