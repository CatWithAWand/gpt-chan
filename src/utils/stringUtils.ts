const isEmptyString = (str: string): boolean => {
  return str.trim().length === 0 || str === undefined || str === null;
};

export { isEmptyString };
