import { Client, Collection, SlashCommandBuilder, Interaction } from 'discord.js';

// Environment configuration types
export interface EnvironmentConfig {
  loadAddons: boolean;
  isDebug: boolean;
}

export function validateEnvironmentVariables(): string[];
export function getProjectDirectory(): string;
export const loadAddons: boolean;
export const isDebug: boolean;

// Command structure types
export interface CommandInfo {
  name?: string;
  version?: string;
  mainfile?: string;
  type?: string;
  [key: string]: string | undefined;
}

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: Interaction, client?: Client) => Promise<void>;
  info?: CommandInfo;
}

export interface AddonInfo {
  name?: string;
  version?: string;
  mainfile?: string;
  type?: string;
  [key: string]: string | undefined;
}

export interface Addon {
  execute: (client: Client) => Promise<void>;
}

export interface Event {
  name: string;
  once?: boolean;
  execute: (...args: any[]) => Promise<void>;
}

// Member data types
export interface MemberData {
  userId: string;
  username: string;
  roles: string;
  formattedJoinedAt: string;
}

// Bot setup functions (from docky)
export function setupBot(): Promise<Client>;

// Loader functions
export function loadCommands(client: Client): Promise<boolean>;
export function loadEvents(client: Client): Promise<void>;
export function loadAddonsIfEnabled(client: Client): Promise<void>;

// Registration functions
export function registerCommands(client: Client): Promise<void>;
export function registerMembers(client: Client): Promise<void>;

// Utility functions
export function parseInfoFile(filePath: string): CommandInfo | AddonInfo | null;

// Core framework types and exports
export interface Logger {
  info(msg: string, ...args: any[]): void;
  i(msg: string, ...args: any[]): void;
  warn(msg: string, ...args: any[]): void;
  error(msg: string, ...args: any[]): void;
  debug(msg: string, ...args: any[]): void;
  success(msg: string, ...args: any[]): void;
  log(msg: string, ...args: any[]): void;
}

export const logger: Logger;

export interface Database {
  query(sql: string, params?: any[]): Promise<any>;
  execute(sql: string, params?: any[]): Promise<any>;
}

export const db: Database;
export function initDatabases(): Promise<void>;

export class ErrorHandler {
  static handle(error: Error, context?: any): void;
  static handleError(error: any, context: string, logger: any): void;
  static handleAndCheckCritical(
    error: any,
    context: string,
    logger: any
  ): boolean;
  static getErrorExplanation(error: any): {
    title: string;
    description: string;
    solution: string;
    severity: string;
  };
  static addErrorMapping(code: string, errorInfo: any): void;
  static isCritical(error: any): boolean;
}

export interface InteractionContext {
  [key: string]: any;
}

export function handleInteraction(
  interaction: InteractionContext,
  client: Client,
  logger?: Logger
): Promise<void>;

export function logBanner(): void;

export interface BotFrameworkOptions {
  showBanner?: boolean;
  autoInstall?: boolean;
  verbose?: boolean;
  silent?: boolean;
  [key: string]: any;
}

export class BotFramework {
  logger: Logger;
  options: BotFrameworkOptions;
  initialized: boolean;

  constructor(options?: BotFrameworkOptions);
  initialize(): Promise<void>;
  getDatabase(): Database;
  getErrorHandler(): typeof ErrorHandler;
  getLogger(): Logger;
  handleInteraction(
    interaction: InteractionContext,
    client: Client,
    logger?: Logger
  ): Promise<void>;
}

export default BotFramework;

// Extend Discord.js Client type to include commands collection
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>;
  }
}

// Module declarations for individual exports
declare module "@botport/tickets/lib/database/db" {
  export interface Database {
    query(sql: string, params?: any[]): Promise<any>;
    execute(sql: string, params?: any[]): Promise<any>;
  }

  export const db: Database;
  export function initDatabases(): Promise<void>;
}

declare module "@botport/tickets/lib/handlers/errors" {
  export class ErrorHandler {
    static handle(error: Error, context?: any): void;
    static handleError(error: any, context: string, logger: any): void;
    static handleAndCheckCritical(
      error: any,
      context: string,
      logger: any
    ): boolean;
    static getErrorExplanation(error: any): {
      title: string;
      description: string;
      solution: string;
      severity: string;
    };
    static addErrorMapping(code: string, errorInfo: any): void;
    static isCritical(error: any): boolean;
  }
}

declare module "@botport/tickets/lib/handlers/interactions" {
  export function handleInteraction(
    interaction: any,
    client: any,
    logger?: any
  ): Promise<void>;
}

declare module "@botport/tickets/lib/logger" {
  export interface Logger {
    info(msg: string, ...args: any[]): void;
    i(msg: string, ...args: any[]): void;
    warn(msg: string, ...args: any[]): void;
    error(msg: string, ...args: any[]): void;
    debug(msg: string, ...args: any[]): void;
    success(msg: string, ...args: any[]): void;
    log(msg: string, ...args: any[]): void;
  }

  const logger: Logger;
  export default logger;
}

declare module "@botport/tickets/lib/essentials/banner" {
  export default function logBanner(): void;
}