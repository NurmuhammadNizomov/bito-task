import { Flex, Heading, Text, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Flex direction="column" align="center" justify="center" h="100vh" gap={4}>
      <Heading size="4xl" color="fg.muted">404</Heading>
      <Heading size="lg">Page not found</Heading>
      <Text color="fg.muted">The page you are looking for does not exist.</Text>
      <Button colorPalette="blue" onClick={() => navigate('/')}>
        Back
      </Button>
    </Flex>
  );
}
