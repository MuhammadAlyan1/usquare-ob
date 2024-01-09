export const isEmailValid = (email: string): boolean => {
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g;
  return !!email.match(emailRegex);
};
