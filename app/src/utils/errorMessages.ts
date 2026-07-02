// User-friendly error messages mapping
// Converts technical backend errors into readable user messages

const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'Invalid credentials': 'The email or password you entered is incorrect. Please try again.',
  'Invalid email or password': 'The email or password you entered is incorrect. Please try again.',
  'User not found': 'No account found with this email address. Please sign up first.',
  'User already exists': 'An account with this email already exists. Please sign in instead.',
  'Email already exists': 'An account with this email already exists. Please sign in instead.',
  'Email already registered': 'An account with this email already exists. Please sign in instead.',
  'Unauthorized': 'Your session has expired. Please sign in again.',
  'Token expired': 'Your session has expired. Please sign in again.',
  'Invalid token': 'Your session has expired. Please sign in again.',
  'Access denied': 'You don\'t have permission to perform this action.',
  'Forbidden': 'You don\'t have permission to access this resource.',
  
  // Validation errors
  'Validation failed': 'Please check your input and try again.',
  'Invalid email': 'Please enter a valid email address.',
  'Invalid email format': 'Please enter a valid email address.',
  'Password too short': 'Password must be at least 8 characters long.',
  'Password must be at least 8 characters': 'Password must be at least 8 characters long.',
  'Passwords do not match': 'The passwords you entered don\'t match. Please try again.',
  'Required field': 'Please fill in all required fields.',
  'Invalid phone number': 'Please enter a valid phone number.',
  
  // Order errors
  'Order not found': 'We couldn\'t find this order. Please check the order number.',
  'Product not found': 'This product is no longer available.',
  'Product out of stock': 'Sorry, this item is currently out of stock.',
  'Insufficient stock': 'Sorry, we don\'t have enough stock for this item.',
  'Cart is empty': 'Your cart is empty. Please add items before checking out.',
  
  // Payment errors
  'Payment failed': 'Payment could not be processed. Please try again or use a different payment method.',
  'Payment verification failed': 'We couldn\'t verify your payment. Please contact support.',
  'Invalid payment reference': 'Invalid payment reference. Please try again.',
  
  // Network errors
  'Network error': 'Connection error. Please check your internet and try again.',
  'Failed to fetch': 'Connection error. Please check your internet and try again.',
  'Network request failed': 'Connection error. Please check your internet and try again.',
  'timeout': 'The request took too long. Please try again.',
  'ECONNREFUSED': 'Unable to connect to the server. Please try again later.',
  
  // Upload errors
  'File too large': 'The file you selected is too large. Please choose a smaller file.',
  'Invalid file type': 'This file type is not supported. Please choose a different file.',
  'Upload failed': 'File upload failed. Please try again.',
  'Cloudinary upload failed': 'Image upload failed. Please try again.',
  
  // Generic errors
  'Internal server error': 'Something went wrong on our end. Please try again later.',
  'Server error': 'Something went wrong on our end. Please try again later.',
  'Something went wrong': 'Something went wrong. Please try again.',
  'Bad request': 'Invalid request. Please check your input and try again.',
  'Not found': 'The requested resource was not found.',
  'Service unavailable': 'Service temporarily unavailable. Please try again later.',
};

/**
 * Convert technical error messages to user-friendly messages
 */
export function getUserFriendlyError(error: any): string {
  // Handle null/undefined
  if (!error) return 'An unexpected error occurred. Please try again.';
  
  // Extract error message
  let errorMessage = '';
  
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error.message) {
    errorMessage = error.message;
  } else if (error.error) {
    errorMessage = error.error;
  } else {
    errorMessage = String(error);
  }
  
  // Convert to lowercase for case-insensitive matching
  const lowerMessage = errorMessage.toLowerCase();
  
  // Check for exact matches first
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (lowerMessage === key.toLowerCase()) {
      return value;
    }
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // Handle HTTP status codes
  if (error.status) {
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with existing data. Please refresh and try again.';
      case 422:
        return 'Please check your input and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Something went wrong on our end. Please try again later.';
    }
  }
  
  // If no match found, return a generic user-friendly message
  // but preserve specific details if they seem user-readable
  if (errorMessage.length < 100 && !errorMessage.includes('Error:') && !errorMessage.includes('at ')) {
    return errorMessage;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Format validation errors from backend
 */
export function formatValidationErrors(errors: any): string {
  if (!errors) return 'Please check your input and try again.';
  
  // Handle Zod-style validation errors
  if (errors.fieldErrors) {
    const messages: string[] = [];
    for (const [field, errs] of Object.entries(errors.fieldErrors)) {
      if (Array.isArray(errs) && errs.length > 0) {
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
        messages.push(`${fieldName}: ${errs[0]}`);
      }
    }
    if (messages.length > 0) {
      return messages.join('. ');
    }
  }
  
  // Handle array of error strings
  if (Array.isArray(errors)) {
    return errors.join('. ');
  }
  
  return 'Please check your input and try again.';
}
