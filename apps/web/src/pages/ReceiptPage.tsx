import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Box, Flex, Heading, Text, Button, Badge, VStack, HStack, Separator,
} from '@chakra-ui/react';
import { AxiosError } from 'axios';
import api from '../lib/axios';
import type { Receipt } from '../api/receipts';
import { payOrder } from '../api/orders';
import { LoadingState } from '../components/AppStates';

export function ReceiptPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);

  const fetchReceipt = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get<{ success: boolean; data: Receipt }>(
        `/orders/${orderId}/receipt`,
        { skipErrorToast: true },
      );
      setReceipt(res.data.data);
    } catch (err: unknown) {
      const fromResponse =
        err instanceof AxiosError ? err.response?.data?.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const message = fromResponse || (err instanceof Error ? err.message : '');
      setError(message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const initialFetchRef = useRef(true);
  useEffect(() => {
    if (!orderId) return;
    if (initialFetchRef.current) {
      initialFetchRef.current = false;
      fetchReceipt();
    }
  }, [orderId, fetchReceipt]);

  async function handlePay() {
    if (!orderId) return;
    setPaying(true);
    try {
      await payOrder(orderId);
      await fetchReceipt();
    } catch {
      /* toast handled by axios interceptor */
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return <LoadingState text="Loading..." />;
  }

  // A receipt is only issued for paid orders. A pending order offers to confirm payment;
  // any other error offers retry.
  if (error) {
    const isPending = /paid/i.test(error);
    return (
      <Flex direction="column" align="center" gap={4} py={12} px={4}>
        <Heading size="md">{isPending ? 'Pending' : 'An error occurred'}</Heading>
        <Text color="fg.muted">{error}</Text>
        <HStack gap={3}>
          {isPending ? (
            <Button colorPalette="green" onClick={handlePay} loading={paying}>
              Confirm payment
            </Button>
          ) : (
            <Button colorPalette="blue" onClick={fetchReceipt}>
              Retry
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/">Back to POS</Link>
          </Button>
        </HStack>
      </Flex>
    );
  }

  if (!receipt) return null;

  const statusColor = receipt.status === 'paid' ? 'green' : receipt.status === 'cancelled' ? 'red' : 'yellow';
  const statusLabel = receipt.status === 'paid' ? 'Paid' : receipt.status === 'cancelled' ? 'Cancelled' : 'Pending';

  const itemCount = receipt.items.reduce((sum, i) => sum + i.quantity, 0);
  const dashed = { borderStyle: 'dashed' as const, borderColor: 'border', my: 3 };

  return (
    <Flex direction="column" align="center" py={8} px={4} gap={5}>
      {/* Receipt "paper" */}
      <Box
        className="receipt-paper"
        w="full"
        maxW="360px"
        bg="bg.panel"
        borderWidth={1}
        borderColor="border"
        borderRadius="md"
        shadow="md"
        px={6}
        py={5}
        fontFamily="mono"
        fontSize="sm"
      >
        {/* Store header */}
        <VStack gap={0} mb={1}>
          <Heading size="md" letterSpacing="wider">POS</Heading>
          <Text color="fg.muted" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
            Receipt
          </Text>
        </VStack>

        <Separator {...dashed} />

        {/* Meta */}
        <VStack gap={1} align="stretch">
          <Flex justify="space-between">
            <Text color="fg.muted">Order #</Text>
            <Text fontWeight="bold">#{receipt.orderId.slice(-8).toUpperCase()}</Text>
          </Flex>
          <Flex justify="space-between">
            <Text color="fg.muted">Date</Text>
            <Text>{format(new Date(receipt.issuedAt), 'dd/MM/yyyy HH:mm')}</Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Text color="fg.muted">Status</Text>
            <Badge colorPalette={statusColor} size="sm">{statusLabel}</Badge>
          </Flex>
        </VStack>

        <Separator {...dashed} />

        {/* Items — thermal style: name on its own line, qty × unit → line total */}
        <VStack gap={2} align="stretch">
          {receipt.items.map((item, i) => (
            <Box key={i}>
              <Text fontWeight="medium" truncate>{item.productName}</Text>
              <Flex justify="space-between" color="fg.muted">
                <Text>{item.quantity} × {item.unitPrice.toLocaleString()}</Text>
                <Text color="fg" fontWeight="semibold">{item.totalPrice.toLocaleString()} so'm</Text>
              </Flex>
            </Box>
          ))}
        </VStack>

        <Separator {...dashed} />

        {/* Totals */}
        <VStack gap={1} align="stretch">
          <Flex justify="space-between" color="fg.muted">
            <Text>items</Text>
            <Text>{itemCount}</Text>
          </Flex>
          <Flex justify="space-between" fontWeight="bold" fontSize="md">
            <Text>Grand Total</Text>
            <Text>{receipt.total.toLocaleString()} so'm</Text>
          </Flex>
        </VStack>

        <Separator {...dashed} />

        {/* Paid stamp + footer */}
        <VStack gap={1} py={1}>
          {receipt.status === 'paid' && (
            <Text
              fontWeight="bold"
              letterSpacing="widest"
              color="green.fg"
              borderWidth={2}
              borderColor="green.fg"
              borderRadius="sm"
              px={3}
              py={0.5}
              transform="rotate(-4deg)"
            >
              PAID
            </Text>
          )}
          <Text color="fg.muted" fontSize="xs" mt={1}>Thank you for your purchase!</Text>
        </VStack>
      </Box>

      {/* Actions (not printed) */}
      <HStack gap={3} className="no-print">
        <Button variant="solid" colorPalette="blue" onClick={() => window.print()}>
          Print
        </Button>
        <Button variant="outline" asChild>
          <Link to="/">Back to POS</Link>
        </Button>
        <Button variant="ghost" onClick={() => navigate('/receipts')}>
          Orders
        </Button>
      </HStack>
    </Flex>
  );
}
