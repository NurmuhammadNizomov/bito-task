import { Toast, Toaster, Flex, Box } from '@chakra-ui/react';
import { toaster } from './toaster';

export function ToastContainer() {
  return (
    <Toaster toaster={toaster}>
      {(toast) => (
        <Toast.Root
          key={toast.id}
          borderRadius="xl"
          shadow="lg"
          borderWidth="1px"
          minW="280px"
          maxW="380px"
          p={3}
        >
          <Flex gap={3} align="flex-start">
            <Toast.Indicator mt="2px" flexShrink={0} />
            <Box flex={1} minW={0}>
              <Toast.Title fontSize="sm" fontWeight="semibold" lineHeight="short">
                {toast.title}
              </Toast.Title>
              {toast.description && (
                <Toast.Description fontSize="xs" color="fg.muted" mt={0.5}>
                  {toast.description}
                </Toast.Description>
              )}
            </Box>
            <Toast.CloseTrigger flexShrink={0} />
          </Flex>
        </Toast.Root>
      )}
    </Toaster>
  );
}