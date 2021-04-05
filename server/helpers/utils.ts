
export const preparePattern = (pat: string) => pat.toLowerCase()
                                                  .replace(/\\/g, "\\\\")
                                                  .replace(/%/g, "\\%")
                                                  .replace(/_/g, "\\_")
                                                  .replace(/\*/g, "%")
                                                  .replace(/\?/g, "_");

