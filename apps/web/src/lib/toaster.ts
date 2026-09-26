import { createToaster } from '@chakra-ui/react';

export const toaster = createToaster({
  placement: 'top-end',
  max: 4,
  gap: 8,
});