export const logger = {
  error: (message: string, error: unknown) => {
    console.error(message, error);
    // Add your preferred logging service here
  },
  info: (message: string, data?: unknown) => {
    console.log(message, data);
    // Add your preferred logging service here
  }
}; 