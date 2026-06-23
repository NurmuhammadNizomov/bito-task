import { ToastContainer } from './lib/toast';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useRefreshToken } from './hooks/useRefreshToken';
import { useAuthStore } from './stores/auth';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { PosPage } from './pages/PosPage';
import { ReceiptPage } from './pages/ReceiptPage';
import { ReceiptsPage } from './pages/ReceiptsPage';
import { ReportsPage } from './pages/ReportsPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { NotFoundPage } from './pages/NotFoundPage';
import {
  Button, Flex, Text, HStack, Badge, MenuRoot, MenuTrigger, MenuContent,
  MenuItem, MenuPositioner, Container, Spacer, IconButton, Portal,
} from '@chakra-ui/react';
import { useColorMode } from './lib/color-mode';
import { FiSun, FiMoon, FiLogOut, FiChevronDown } from 'react-icons/fi';

function NavBar() {
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { colorMode, toggleColorMode } = useColorMode();

  if (!isAuthenticated) return null;

  const isAdmin = user?.role === 'ADMIN';

  const navLinks = [
    { path: '/', label: 'POS' },
    { path: '/receipts', label: 'Orders' },
    ...(isAdmin ? [{ path: '/reports', label: 'Reports' }] : []),
  ];

  return (
    <Flex
      as="nav"
      h={14}
      align="center"
      px={4}
      borderBottomWidth={1}
      bg="bg"
      shadow="sm"
      gap={2}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Text fontWeight="bold" fontSize="lg" mr={2}>POS</Text>

      <HStack gap={1}>
        {navLinks.map((link) => (
          <Button
            key={link.path}
            variant={location.pathname === link.path ? 'subtle' : 'ghost'}
            size="sm"
            colorPalette={location.pathname === link.path ? 'blue' : 'gray'}
            onClick={() => navigate(link.path)}
          >
            {link.label}
          </Button>
        ))}
      </HStack>

      <Spacer />

      <HStack gap={2}>
        <IconButton aria-label="Toggle dark mode" variant="ghost" size="sm" onClick={toggleColorMode}>
          {colorMode === 'light' ? <FiMoon /> : <FiSun />}
        </IconButton>

        <MenuRoot>
          <MenuTrigger asChild>
            <HStack cursor="pointer" gap={2} px={2} py={1} borderRadius="md" _hover={{ bg: 'bg.subtle' }}>
              <Text fontSize="sm" fontWeight="medium">{user?.name}</Text>
              <Badge colorPalette="blue" size="sm">{user?.role}</Badge>
              <FiChevronDown style={{ opacity: 0.5 }} />
            </HStack>
          </MenuTrigger>
          <Portal>
            <MenuPositioner>
              <MenuContent>
                <MenuItem value="logout" onClick={() => { logout(); navigate('/login'); }} color="fg.error">
                  <FiLogOut />
                  Logout
                </MenuItem>
              </MenuContent>
            </MenuPositioner>
          </Portal>
        </MenuRoot>
      </HStack>
    </Flex>
  );
}

export default function App() {
  useRefreshToken();

  return (
    <BrowserRouter>
      <ToastContainer />
      <NavBar />
      <Container maxW="1400px" py={4}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><PosPage /></ProtectedRoute>} />
          <Route path="/receipt/:orderId" element={<ProtectedRoute><ReceiptPage /></ProtectedRoute>} />
          <Route path="/receipts" element={<ProtectedRoute><ReceiptsPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute roles={['ADMIN']}><ReportsPage /></ProtectedRoute>} />
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}
