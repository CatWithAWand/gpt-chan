const isString = (str: unknown): boolean => {
  return typeof str === 'string' || str instanceof String;
};

const isEmptyString = (str: string): boolean => {
  return str.trim().length === 0 || str === undefined || str === null;
};

export { isString, isEmptyString };
