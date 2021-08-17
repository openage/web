export class Logger {
  private _context: any;
  private _parent?: Logger;

  // Define log levels and their hierarchy
  private static levels: { [key: string]: number } = {
    silly: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
  };

  // Default log level
  private static logLevel: number = Logger.levels['debug'];

  constructor(context?: any, parent?: Logger) {
    context = context || {};
    this._parent = parent;

    if (typeof context === 'string') {
      context = {
        name: context,
      }
    } else if (typeof context === 'function') {
      context = {
        name: context.name
      }
    }

    this._context = {
      name: context.name || this._parent?._context?.name,
      method: this._parent?._context?.method ? `${this._parent?._context?.method}:${context.method}` : context.method,
      path: context.path || this._parent?._context?.path
    };
  }

  // Set the log level
  static setLogLevel(level: string) {
    if (Logger.levels[level] !== undefined) {
      Logger.logLevel = Logger.levels[level];
    } else {
      throw new Error(`Invalid log level: ${level}`);
    }
  }

  private _addContext(optionalParams: any[]) {
    optionalParams = optionalParams || [];
    optionalParams.push(this._context);
  }

  private _createMessage(message: any) {
    return `[${this._context.name}:${this._context.method}] ${message}`
  }

  private _shouldLog(level: string): boolean {
    return Logger.levels[level] >= Logger.logLevel;
  }

  get(context?: any) {
    if (typeof context === 'string') {
      context = {
        method: context,
      }
    } else if (typeof context === 'function') {
      context = {
        method: context.name
      }
    }
    const logger = new Logger(context, this);

    return logger;
  }

  end(message?: any, ...optionalParams: any[]) {
    return this._parent;
  }

  silly(message?: any, ...optionalParams: any[]) {
    if (this._shouldLog('silly')) {
      this._addContext(optionalParams);
      console.log(this._createMessage(message), optionalParams);
    }
  }

  debug(message?: any, ...optionalParams: any[]) {
    if (this._shouldLog('debug')) {
      this._addContext(optionalParams);
      console.log(this._createMessage(message), optionalParams);
    }
  }

  info(message?: any, ...optionalParams: any[]) {
    if (this._shouldLog('info')) {
      this._addContext(optionalParams);
      console.info(this._createMessage(message), optionalParams);
    }
  }

  warn(message?: any, ...optionalParams: any[]) {
    if (this._shouldLog('warn')) {
      this._addContext(optionalParams);
      console.warn(this._createMessage(message), optionalParams);
    }
  }

  error(message?: any, ...optionalParams: any[]) {
    if (this._shouldLog('error')) {
      this._addContext(optionalParams);
      console.error(this._createMessage(message), optionalParams);
    }
  }

  log(message?: any, ...optionalParams: any[]) {
    if (this._shouldLog('debug')) {
      this._addContext(optionalParams);
      console.log(this._createMessage(message), optionalParams);
    }
  }
}
