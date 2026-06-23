import { useState, useEffect, useCallback, useRef } from 'react';
import { AxiosError } from 'axios';
import { searchProducts } from '../api/products';
import type { Product } from '../api/products';
import { createOrder } from '../api/orders';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Flex, Grid, Heading, Text, Input, Button, Badge, Card, Spinner,
  VStack, HStack, Stack, NumberInput, Separator, Alert, Table, IconButton,
  InputGroup,
} from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import { EmptyState } from '../components/AppStates';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  stock: number;
  quantity: number;
}

export function PosPage() {
  // Keep the search term in the URL (?search=) so a refresh preserves the filter.
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('search') ?? '');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const [placing, setPlacing] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const search = useCallback(async (q: string): Promise<Product[]> => {
    setSearching(true);
    try {
      const res = await searchProducts(q);
      setProducts(res.data);
      return res.data;
    } catch {
      return [];
    } finally {
      setSearching(false);
    }
  }, []);

  // After an oversell rejection the cart's stock is stale: re-read live stock and trim quantities.
  const reconcileCartWithStock = useCallback(async (): Promise<{ name: string; stock: number }[]> => {
    const fresh = await search(query);
    const adjusted: { name: string; stock: number }[] = [];
    setCart((prev) =>
      prev
        .map((c) => {
          const p = fresh.find((fp) => fp._id === c.productId);
          if (!p) return c;
          if (p.stock < c.quantity) adjusted.push({ name: c.name, stock: p.stock });
          return { ...c, stock: p.stock, quantity: Math.min(c.quantity, p.stock) };
        })
        .filter((c) => c.quantity > 0),
    );
    return adjusted;
  }, [search, query]);

  const buildStockMessage = useCallback(
    (adjusted: { name: string; stock: number }[]): string => {
      if (adjusted.length === 0) return 'Stock changed';
      return adjusted
        .map((a) =>
          a.stock === 0
            ? `"${a.name}" is sold out and was removed from the cart.`
            : `"${a.name}" — only ${a.stock} left in stock, quantity updated.`,
        )
        .join(' ');
    },
    [],
  );

  const initialSearchRef = useRef(true);
  useEffect(() => {
    if (initialSearchRef.current) {
      initialSearchRef.current = false;
      search(query);
    }
  }, [search, query]);

  function handleSearchChange(value: string) {
    setQuery(value);
    setSearchParams(value ? { search: value } : {}, { replace: true });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product._id);
      if (existing) {
        return prev.map((c) =>
          c.productId === product._id
            ? { ...c, quantity: Math.min(c.quantity + 1, product.stock) }
            : c,
        );
      }
      return [...prev, { productId: product._id, name: product.name, price: product.salePrice, stock: product.stock, quantity: 1 }];
    });
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }

  function setQuantity(productId: string, value: number) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.productId === productId ? { ...c, quantity: value } : c,
        )
        .filter((c) => c.quantity > 0),
    );
  }

  async function checkout() {
    const stockErrors = cart.filter((c) => c.quantity > c.stock);
    if (stockErrors.length > 0) {
      setError('Stock changed');
      return;
    }

    setError('');
    setPlacing(true);
    try {
      const order = await createOrder(cart.map((c) => ({ productId: c.productId, quantity: c.quantity })));
      setCart([]);
      navigate(`/receipt/${order._id}`);
    } catch (err: unknown) {
      const msg = err instanceof AxiosError ? err.response?.data?.message || err.message : err instanceof Error ? err.message : '';
      if (msg.includes('stock') || msg.includes('Insufficient') || msg.includes('quantity')) {
        const adjusted = await reconcileCartWithStock();
        setError(buildStockMessage(adjusted));
      } else if (msg.includes('available') || msg.includes('unavailable')) {
        const adjusted = await reconcileCartWithStock();
        setError(adjusted.length ? buildStockMessage(adjusted) : 'Product unavailable');
      } else {
        setError(msg || 'Order failed');
      }
    }
    setPlacing(false);
  }

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const itemCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <Grid templateColumns={{ base: '1fr', md: '3fr 2fr' }} gap={4} h="calc(100vh - 80px)">
      {/* Left Panel - Product Catalog */}
      <Box overflow="auto" p={5} borderWidth={1} borderColor="border" borderRadius="l2" bg="bg.panel" shadow="sm">
        <VStack gap={4} align="stretch">
          <Heading size="lg">POS Checkout</Heading>

          <InputGroup startElement={<FiSearch />}>
            <Input
              placeholder="Search products..."
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              bg="bg"
            />
          </InputGroup>

          {searching ? (
            <Flex justify="center" py={16}>
              <Spinner />
            </Flex>
          ) : products.length === 0 ? (
            <EmptyState title="No products found" description="Search products..." />
          ) : (
            <Stack gap={3}>
              {products.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock < 10;
                return (
                  <Card.Root
                    key={p._id}
                    variant="outline"
                    transition="all 0.15s"
                    _hover={{ borderColor: 'brand.400', shadow: 'sm', transform: 'translateY(-1px)' }}
                  >
                    <Card.Body py={3} px={4}>
                      <Flex justify="space-between" align="center" gap={4}>
                        <Box minW={0}>
                          <Text fontWeight="semibold" truncate>{p.name}</Text>
                          <Text fontSize="sm" color="fg.muted">{p.sku}</Text>
                          <HStack gap={2} mt={1} flexWrap="wrap">
                            {isOutOfStock ? (
                              <Badge colorPalette="red" size="sm">Out of stock</Badge>
                            ) : isLowStock ? (
                              <Badge colorPalette="yellow" size="sm">Low stock ({p.stock})</Badge>
                            ) : (
                              <Text fontSize="sm" color="fg.muted">{p.stock} items</Text>
                            )}
                            <Text fontWeight="bold" color="blue.600">
                              {p.salePrice.toLocaleString()} so'm
                            </Text>
                          </HStack>
                        </Box>
                        <Button
                          size="sm"
                          colorPalette="blue"
                          onClick={() => addToCart(p)}
                          disabled={isOutOfStock}
                          flexShrink={0}
                        >
                          Add
                        </Button>
                      </Flex>
                    </Card.Body>
                  </Card.Root>
                );
              })}
            </Stack>
          )}
        </VStack>
      </Box>

      {/* Right Panel - Cart */}
      <Box
        overflow="auto"
        p={5}
        borderWidth={1}
        borderColor="border"
        borderRadius="l2"
        bg="bg.panel"
        shadow="sm"
        display="flex"
        flexDirection="column"
      >
        <Heading size="lg" mb={4}>Cart</Heading>

        {cart.length === 0 ? (
          <Flex flex={1} align="center" justify="center">
            <EmptyState title="Cart is empty" />
          </Flex>
        ) : (
          <>
            <Box flex={1} overflow="auto">
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Product</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="center">Qty</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right">Price</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right">Total</Table.ColumnHeader>
                    <Table.ColumnHeader />
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {cart.map((c) => (
                    <Table.Row key={c.productId}>
                      <Table.Cell>
                        <Text fontWeight="medium" fontSize="sm">{c.name}</Text>
                      </Table.Cell>
                      <Table.Cell textAlign="center">
                        <NumberInput.Root
                          value={c.quantity.toString()}
                          min={0}
                          max={c.stock}
                          onValueChange={(e) => {
                            const qty = Number.isNaN(e.valueAsNumber) ? 0 : e.valueAsNumber;
                            if (qty > c.stock) {
                              setError('Stock changed');
                            } else {
                              setError('');
                            }
                            setQuantity(c.productId, qty);
                          }}
                          size="sm"
                          width="110px"
                          mx="auto"
                        >
                          <HStack gap={0}>
                            <NumberInput.Input />
                            <NumberInput.Control />
                          </HStack>
                        </NumberInput.Root>
                      </Table.Cell>
                      <Table.Cell textAlign="right">
                        <Text fontSize="sm">{c.price.toLocaleString()} so'm</Text>
                      </Table.Cell>
                      <Table.Cell textAlign="right">
                        <Text fontWeight="semibold">{(c.price * c.quantity).toLocaleString()} so'm</Text>
                      </Table.Cell>
                      <Table.Cell textAlign="right">
                        <IconButton
                          aria-label="Remove"
                          size="xs"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => removeFromCart(c.productId)}
                        >
                          ✕
                        </IconButton>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>

            <Separator my={3} />

            {error && (
              <Alert.Root status="error" mb={3}>
                <Alert.Indicator />
                <Alert.Title>{error}</Alert.Title>
              </Alert.Root>
            )}

            <Flex
              justify="space-between"
              align="center"
              bg="brand.subtle"
              borderRadius="l1"
              px={4}
              py={3}
              mb={3}
            >
              <Text fontSize="sm" color="fg.muted">
                Subtotal ({itemCount} items)
              </Text>
              <Text fontSize="xl" fontWeight="bold" color="brand.fg">
                {total.toLocaleString()} so'm
              </Text>
            </Flex>

            <Box position="relative">
              <Button
                w="full"
                colorPalette="blue"
                size="lg"
                onClick={checkout}
                disabled={placing || cart.length === 0}
              >
                Place Order
              </Button>
              {placing && (
                <Flex
                  position="absolute"
                  inset={0}
                  align="center"
                  justify="center"
                  bg="bg/80"
                  rounded="md"
                >
                  <Spinner />
                </Flex>
              )}
            </Box>
          </>
        )}
      </Box>
    </Grid>
  );
}
