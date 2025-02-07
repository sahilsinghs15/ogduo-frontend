class ErrorUtils {
  static globalHandler: ((error: any) => void) | null = null;

  static setGlobalHandler(handler: (error: any) => void) {
    this.globalHandler = handler;
    return handler;
  }

  static handleError(error: any) {
    if (this.globalHandler) {
      this.globalHandler(error);
    } else {
      console.error("Unhandled error:", error);
    }
  }
}


export default ErrorUtils;
