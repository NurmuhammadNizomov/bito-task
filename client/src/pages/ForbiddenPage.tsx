import { Flex, Heading, Text, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';

export function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <Flex direction="column" align="center" justify="center" h="100vh" gap={4}>
      <FiLock size={48} color="var(--chakra-colors-fg-muted)" />
      <Heading size="lg">403 — Forbidden</Heading>
      <Text color="fg.muted">You do not have permission to access this page.</Text>
      <Button colorPalette="blue" onClick={() => navigate('/')}>
        Back
      </Button>
    </Flex>
  );
}
