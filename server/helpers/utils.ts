
export const preparePattern = (pat: string) => pat.toLowerCase()
                                                  .replace(/\\/g, "\\\\")
                                                  .replace(/%/g, "\\%")
                                                  .replace(/[_ ]/g, "\\_")
                                                  .replace(/\*/g, "%")
                                                  .replace(/\?/g, "_");

export function fixedFormatTime(ms: number | undefined) {
  if(typeof ms !== "number") return "   ???";
  
  if(ms < 10) return `${ms.toFixed(2)}ms`;
  else if(ms < 100) return `${ms.toFixed(1)}ms`;
  else if(ms < 1000) return ` ${ms.toFixed(0)}ms`;
  else if(ms < 1000 * 10) return ` ${(ms / 1000).toFixed(2)}s`;
  else if(ms < 1000 * 60) return ` ${(ms / 1000).toFixed(1)}s`;
  else if(ms < 1000 * 60 * 10) return ` ${(ms / 1000 / 60).toFixed(2)}m`;
  else if(ms < 1000 * 60 * 60) return ` ${(ms / 1000 / 60).toFixed(1)}m`;
  else if(ms < 1000 * 60 * 60 * 10) return ` ${(ms / 1000 / 60 / 60).toFixed(2)}h`;
  else if(ms < 1000 * 60 * 60 * 24) return ` ${(ms / 1000 / 60 / 60).toFixed(1)}h`;
  else return `  ${(ms / 1000 / 60 / 60).toFixed(0)}h`;
}
