import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flex, Card, VStack, Heading, Text, Field, Input, Alert, Button, Box, Select, createListCollection,
} from '@chakra-ui/react';
import { AxiosError } from 'axios';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';

// Demo accounts seeded by `npm run seed` — all share the same password.
const DEMO_PASSWORD = '123456';
const DEMO_USERS = [
  { value: 'admin.a@demo.uz', label: 'Tenant A — Admin' },
  { value: 'cashier.a@demo.uz', label: 'Tenant A — Cashier One' },
  { value: 'cashier.a2@demo.uz', label: 'Tenant A — Cashier Two' },
];

const demoUsersCollection = createListCollection({ items: DEMO_USERS });

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setFieldErrors({ email: fe.email?.[0], password: fe.password?.[0] });
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'ADMIN' ? '/reports' : '/');
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        if (!err.response) {
          setError('Network error');
        } else if (err.response.status === 401) {
          setError('Invalid email or password');
        } else {
          setError('Login failed');
        }
      } else {
        setError('Login failed');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Flex h="100vh" align="center" justify="center" p={4} overflow="hidden">
      <Card.Root
        maxW="400px"
        w="full"
        shadow="xl"
        borderRadius="l3"
        borderWidth={1}
        borderColor="border"
        overflow="hidden"
      >
        {/* Brand header */}
        <Box bg="brand.600" color="white" px={8} pt={8} pb={6} textAlign="center">
          <Flex
            w={12} h={12} mx="auto" mb={3}
            align="center" justify="center"
            bg="whiteAlpha.300" borderRadius="l2"
            fontWeight="bold" fontSize="xl"
          >
            P
          </Flex>
          <Heading size="lg" letterSpacing="tight">POS</Heading>
          <Text fontSize="sm" opacity={0.85} mt={1}>Login</Text>
        </Box>

        <Card.Body p={8}>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack gap={4} align="stretch">
              <Field.Root>
                <Field.Label>Demo user</Field.Label>
                <Select.Root
                  collection={demoUsersCollection}
                  value={email ? [email] : []}
                  onValueChange={(e) => {
                    setEmail(e.value[0] ?? '');
                    if (e.value[0]) setPassword(DEMO_PASSWORD);
                  }}
                >
                  <Select.Trigger>
                    <Select.ValueText placeholder="select a user" />
                  </Select.Trigger>
                  <Select.Indicator />
                  <Select.Positioner>
                    <Select.Content>
                      <Select.List>
                        {demoUsersCollection.items.map((item) => (
                          <Select.Item key={item.value} item={item}>
                            <Select.ItemText>{item.label}</Select.ItemText>
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.List>
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
              </Field.Root>

              <Field.Root invalid={!!fieldErrors.email}>
                <Field.Label>Email</Field.Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
                {fieldErrors.email && <Field.ErrorText>{fieldErrors.email}</Field.ErrorText>}
              </Field.Root>

              <Field.Root invalid={!!fieldErrors.password}>
                <Field.Label>Password</Field.Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                {fieldErrors.password && <Field.ErrorText>{fieldErrors.password}</Field.ErrorText>}
              </Field.Root>

              {error && (
                <Alert.Root colorPalette="red" borderRadius="l1">
                  <Alert.Indicator />
                  <Alert.Title>{error}</Alert.Title>
                </Alert.Root>
              )}

              <Button
                type="submit"
                variant="solid"
                colorPalette="blue"
                w="full"
                size="lg"
                mt={2}
                loading={loading}
                loadingText="Logging in..."
              >
                Login
              </Button>
            </VStack>
          </form>
        </Card.Body>
      </Card.Root>
    </Flex>
  );
}
