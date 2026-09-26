import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { FiInbox, FiAlertCircle } from 'react-icons/fi';

interface EmptyStateProps { icon?: React.ReactNode; title: string; description?: string; action?: { label: string; onClick: () => void }; }
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Flex direction="column" align="center" justify="center" py={16} gap={3}>
      <Box color="fg.muted" fontSize="4xl">{icon || <FiInbox />}</Box>
      <Text fontWeight="semibold">{title}</Text>
      {description && <Text fontSize="sm" color="fg.muted" textAlign="center" maxW="md">{description}</Text>}
      {action && <Button size="sm" mt={2} onClick={action.onClick}>{action.label}</Button>}
    </Flex>
  );
}

interface ErrorStateProps { title?: string; message: string; onRetry?: () => void; }
export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <Flex direction="column" align="center" justify="center" py={16} gap={3}>
      <Box color="fg.error" fontSize="4xl"><FiAlertCircle /></Box>
      <Text fontWeight="semibold">{title || 'An error occurred'}</Text>
      <Text fontSize="sm" color="fg.muted" textAlign="center">{message}</Text>
      {onRetry && <Button size="sm" mt={2} onClick={onRetry}>Retry</Button>}
    </Flex>
  );
}

interface LoadingStateProps { text?: string; }
export function LoadingState({ text }: LoadingStateProps) {
  return (
    <Flex direction="column" align="center" justify="center" py={16} gap={3}>
      <Box className="chakra-spinner" w={8} h={8} borderWidth={3} borderRadius="full" borderStyle="solid"
        borderColor="blue.500" borderTopColor="transparent" animation="spin 0.8s linear infinite" />
      <Text fontSize="sm" color="fg.muted">{text || 'Loading...'}</Text>
    </Flex>
  );
}
