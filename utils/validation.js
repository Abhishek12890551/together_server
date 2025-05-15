export const EMAIL_REGEX = /^[\w-]+(\.[\w-]+)*@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const validateEmail = (email) => {
  if (!email || email.trim() === "") {
    return { isValid: false, message: "Email is required" };
  }

  if (!EMAIL_REGEX.test(email)) {
    return {
      isValid: false,
      message: "Invalid email format. Please provide a valid email address",
    };
  }

  return { isValid: true };
};

export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: "Password is required" };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  if (!PASSWORD_REGEX.test(password)) {
    return {
      isValid: false,
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    };
  }

  return { isValid: true };
};

export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      message: "Passwords do not match",
    };
  }

  return { isValid: true };
};
