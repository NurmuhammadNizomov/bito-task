import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Box, Heading, Text, Button, Badge, Card, VStack, Table, Skeleton,
} from '@chakra-ui/react';
import api from '../lib/axios';
import { ErrorState, EmptyState } from '../components/AppStates';

interface OrderSummary {
  _id: string;
  status: string;
  total: number;
  createdAt: string;
}

function statusColor(status: string): string {
  if (status === 'paid') return 'green';
  if (status === 'cancelled') return 'red';
  return 'yellow';
}

function statusLabel(status: string): string {
  if (status === 'paid') return 'Paid';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'pending' || status === 'pending_payment') return 'Pending';
  return status;
}

export function ReceiptsPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ success: boolean; data: OrderSummary[] }>('/orders')
      .then((res) => setOrders(res.data.data))
      .catch((err) => setError(err?.response?.data?.message || 'An error occurred'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box maxW="900px" mx="auto" p={6}>
      <VStack gap={6} align="stretch">
        <Heading size="xl">Receipt</Heading>

        {error && <ErrorState message={error} />}

        {loading && (
          <Card.Root shadow="sm" borderRadius="l2">
            <Card.Body>
              <VStack gap={3} align="stretch">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} h={10} borderRadius="md" />
                ))}
              </VStack>
            </Card.Body>
          </Card.Root>
        )}

        {!loading && !error && orders.length === 0 && (
          <EmptyState title="No receipts" />
        )}

        {!loading && !error && orders.length > 0 && (
          <Card.Root shadow="sm" borderRadius="l2">
            <Card.Body p={0}>
              <Table.Root variant="outline" size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Order #</Table.ColumnHeader>
                    <Table.ColumnHeader>Date</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="right">Grand Total</Table.ColumnHeader>
                    <Table.ColumnHeader />
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {orders.map((order, i) => (
                    <Table.Row key={order._id}>
                      <Table.Cell>
                        <Text fontFamily="mono" fontSize="sm">#{orders.length - i}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontSize="sm">{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette={statusColor(order.status)} size="sm">
                          {statusLabel(order.status)}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell textAlign="right">
                        <Text fontWeight="semibold">{order.total.toLocaleString()} so'm</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => navigate(`/receipt/${order._id}`)}
                        >
                          {order.status === 'paid' ? 'View Receipt' : 'Confirm payment'}
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Card.Body>
          </Card.Root>
        )}
      </VStack>
    </Box>
  );
}
