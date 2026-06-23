import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Grid, Heading, Text, Button, Card,
  VStack, HStack, Table, Stat, Separator, Badge, Flex,
} from '@chakra-ui/react';
import { AxiosError } from 'axios';
import { FiTrendingUp, FiPackage, FiDollarSign } from 'react-icons/fi';
import api from '../lib/axios';
import { LoadingState, ErrorState, EmptyState } from '../components/AppStates';
import { DatePickerField } from '../components/DatePicker';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('uz-UZ', { style: 'decimal', minimumFractionDigits: 0 }).format(value) + " so'm";
}

interface SalesReport {
  from: string;
  to: string;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  items: {
    productName: string;
    quantity: number;
    revenue: number;
    cost: number;
    margin: number;
  }[];
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <Card.Root
      shadow="sm"
      borderRadius="l2"
      transition="all 0.15s"
      _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
    >
      <Card.Body>
        <HStack gap={4} align="center">
          <Flex
            w={12} h={12} borderRadius="l2" align="center" justify="center"
            bg={`${color}.100`} color={`${color}.600`} fontSize="2xl" flexShrink={0}
          >
            {icon}
          </Flex>
          <Box>
            <Text fontSize="sm" color="fg.muted" fontWeight="medium">{label}</Text>
            <Text fontSize="2xl" fontWeight="bold" mt={0.5} letterSpacing="tight">{value}</Text>
          </Box>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}

// Format a Date as YYYY-MM-DD using LOCAL calendar fields. toISOString() would
// convert to UTC and shift the day back in positive-offset zones (e.g. UTC+5),
// so picking the 30th would store the 29th.
function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Parse a YYYY-MM-DD string as LOCAL midnight (not UTC) for the picker.
function fromLocalISODate(s: string): Date {
  return new Date(`${s}T00:00:00`);
}

export function ReportsPage() {
  const [from, setFrom] = useState(() => toLocalISODate(new Date(Date.now() - 7 * 86400000)));
  const [to, setTo] = useState(() => toLocalISODate(new Date()));
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReport = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await api.get<{ success: boolean; data: SalesReport }>('/reports/sales', {
        params: { from, to },
      });
      setReport(res.data.data);
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response?.status === 403) {
        setError('Forbidden');
      } else {
        const message = err instanceof AxiosError ? err.response?.data?.message || err.message : err instanceof Error ? err.message : '';
        setError(message || 'An error occurred');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [from, to]);

  const initialLoadRef = useRef(true);
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      loadReport();
    }
  }, [loadReport]);

  // Replaces the former socket `order:paid` push: poll quietly so paid orders
  // surface in the report without a manual refresh, and without flashing the
  // loading state on each tick.
  useEffect(() => {
    const interval = setInterval(() => {
      loadReport(true);
    }, 20000);
    return () => clearInterval(interval);
  }, [loadReport]);

  const totalQtySold = report?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <Box maxW="1100px" mx="auto" p={6}>
      <VStack gap={6} align="stretch">
        <HStack justify="space-between" wrap="wrap" gap={3}>
          <Heading size="xl">Reports</Heading>
        </HStack>

        <Card.Root shadow="sm" borderRadius="l2">
          <Card.Body>
            <HStack gap={4} wrap="wrap" align="flex-end">
              <Box>
                <DatePickerField
                  label="From"
                  value={fromLocalISODate(from)}
                  onChange={(d) => setFrom(toLocalISODate(d))}
                />
              </Box>
              <Box>
                <DatePickerField
                  label="To"
                  value={fromLocalISODate(to)}
                  onChange={(d) => setTo(toLocalISODate(d))}
                />
              </Box>
              <Button colorPalette="blue" onClick={() => loadReport()} loading={loading} minW="100px">
                Apply
              </Button>
            </HStack>
          </Card.Body>
        </Card.Root>

        {loading && <LoadingState text="Loading..." />}

        {error && <ErrorState message={error} onRetry={loadReport} />}

        {!loading && !error && !report && (
          <EmptyState title="No sales found" />
        )}

        {!loading && !error && report && (
          <>
            {/* Stats */}
            <Grid templateColumns={{ base: '1fr', sm: 'repeat(3, 1fr)' }} gap={4}>
              <StatCard
                label="Revenue"
                value={formatCurrency(report.totalRevenue)}
                icon={<FiDollarSign />}
                color="blue"
              />
              <StatCard
                label="Units Sold"
                value={totalQtySold.toString()}
                icon={<FiPackage />}
                color="purple"
              />
              <StatCard
                label="Margin"
                value={formatCurrency(report.totalMargin)}
                icon={<FiTrendingUp />}
                color={report.totalMargin >= 0 ? 'green' : 'red'}
              />
            </Grid>

            {/* Table */}
            <Card.Root shadow="sm" borderRadius="l2" overflow="hidden">
              <Card.Header pb={3}>
                <Heading size="md">Top Products</Heading>
              </Card.Header>
              <Card.Body p={0}>
                <Table.Root size="md" striped interactive stickyHeader>
                  <Table.Header>
                    <Table.Row bg="bg.muted">
                      <Table.ColumnHeader w="48px" textAlign="center" fontSize="xs" textTransform="uppercase" letterSpacing="wide" color="fg.muted">#</Table.ColumnHeader>
                      <Table.ColumnHeader fontSize="xs" textTransform="uppercase" letterSpacing="wide" color="fg.muted">Product</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="center" fontSize="xs" textTransform="uppercase" letterSpacing="wide" color="fg.muted">Qty Sold</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="right" fontSize="xs" textTransform="uppercase" letterSpacing="wide" color="fg.muted">Cost</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="right" fontSize="xs" textTransform="uppercase" letterSpacing="wide" color="fg.muted">Revenue</Table.ColumnHeader>
                      <Table.ColumnHeader textAlign="right" fontSize="xs" textTransform="uppercase" letterSpacing="wide" color="fg.muted">Margin</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {report.items.length === 0 ? (
                      <Table.Row>
                        <Table.Cell colSpan={6} textAlign="center" py={10} color="fg.muted">
                          No sales found
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      report.items.map((item, i) => (
                        <Table.Row key={i}>
                          <Table.Cell textAlign="center">
                            <Flex
                              w={6} h={6} mx="auto" align="center" justify="center"
                              borderRadius="full" bg="bg.emphasized" color="fg.muted"
                              fontSize="xs" fontWeight="bold"
                            >
                              {i + 1}
                            </Flex>
                          </Table.Cell>
                          <Table.Cell fontWeight="medium">{item.productName}</Table.Cell>
                          <Table.Cell textAlign="center">
                            <Badge colorPalette="blue" variant="subtle" size="sm">{item.quantity}</Badge>
                          </Table.Cell>
                          <Table.Cell textAlign="right" color="fg.muted" fontVariantNumeric="tabular-nums">{formatCurrency(item.cost)}</Table.Cell>
                          <Table.Cell textAlign="right" fontWeight="medium" fontVariantNumeric="tabular-nums">{formatCurrency(item.revenue)}</Table.Cell>
                          <Table.Cell textAlign="right" fontWeight="semibold" fontVariantNumeric="tabular-nums" color={item.margin >= 0 ? 'green.600' : 'red.500'}>
                            {formatCurrency(item.margin)}
                          </Table.Cell>
                        </Table.Row>
                      ))
                    )}
                  </Table.Body>
                </Table.Root>
              </Card.Body>
            </Card.Root>

            <Separator />

            <HStack justify="flex-end" gap={6}>
              <Stat.Root textAlign="right">
                <Stat.Label fontSize="xs">Cost</Stat.Label>
                <Stat.ValueText fontSize="lg" color="fg.muted">{formatCurrency(report.totalCost)}</Stat.ValueText>
              </Stat.Root>
              <Stat.Root textAlign="right">
                <Stat.Label fontSize="xs">Revenue</Stat.Label>
                <Stat.ValueText fontSize="lg">{formatCurrency(report.totalRevenue)}</Stat.ValueText>
              </Stat.Root>
              <Stat.Root textAlign="right">
                <Stat.Label fontSize="xs">Margin</Stat.Label>
                <Stat.ValueText fontSize="lg" color={report.totalMargin >= 0 ? 'green.600' : 'red.500'}>
                  {formatCurrency(report.totalMargin)}
                </Stat.ValueText>
              </Stat.Root>
            </HStack>
          </>
        )}
      </VStack>
    </Box>
  );
}
