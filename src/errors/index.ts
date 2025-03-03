import type { Network, TransactionEnvelope } from "@saberhq/solana-contrib";
import type {
  Commitment,
  KeyedAccountInfo,
  PublicKey,
  TransactionSignature,
} from "@solana/web3.js";

import type { TransactionErrorType } from "./categorizeTransactionError";
import { categorizeTransactionError } from "./categorizeTransactionError";

/**
 * Error originating from Sail.
 */
export class SailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SailError";
  }
}

/**
 * Error on a Solana transaction
 */
export class SailTransactionError extends SailError {
  constructor(
    public readonly network: Network,
    public readonly originalError: Error,
    public readonly txs: readonly TransactionEnvelope[],
    /**
     * User message representing the transaction.
     */
    public readonly userMessage?: string
  ) {
    super(originalError.message);
    this.name = "SolanaTransactionError";
    this.stack = originalError.stack;
  }

  /**
   * Tag used for grouping errors together.
   */
  get tag(): TransactionErrorType | null {
    return categorizeTransactionError(this.message);
  }

  /**
   * Returns true if this error is associated with a simulation.
   */
  get isSimulation(): boolean {
    return this.message.includes("Transaction simulation failed: ");
  }

  /**
   * Fingerprint used for grouping errors.
   */
  get fingerprint(): string[] {
    const tag = this.tag;
    if (tag) {
      return [this.name, tag];
    }
    return [this.name, ...this.message.split(": ")];
  }

  /**
   * Generates a debug string representation of the transactions involved in this error.
   * @param network
   * @returns
   */
  generateTXsString(): string {
    return this.txs
      .map((tx, i) => {
        const parts = [`TX #${i + 1} of ${this.txs.length}:`, tx.debugStr];
        if (this.network !== "localnet") {
          parts.push(
            `View on Solana Explorer: ${tx.generateInspectLink(this.network)}`
          );
        }
        return parts.join("\n");
      })
      .join("\n\n");
  }
}

export class InsufficientSOLError extends SailError {
  constructor(public readonly currentBalance?: number) {
    super("Insufficient SOL balance");
    this.name = "InsufficientSOLError";
  }
}

export class SailRefetchAfterTXError extends SailError {
  constructor(
    public readonly originalError: unknown,
    public readonly writable: readonly PublicKey[],
    public readonly txSigs: readonly TransactionSignature[]
  ) {
    super(
      `Error refetching accounts after transaction: ${
        originalError instanceof Error ? originalError.message : "unknown"
      }`
    );
    this.name = "SailRefetchAfterTXError";
  }
}

/**
 * Thrown if an error occurs when refetching subscriptions.
 */
export class SailRefetchSubscriptionsError extends SailError {
  constructor(public readonly originalError: unknown) {
    super(
      `Error refetching subscribed accounts: ${
        originalError instanceof Error ? originalError.message : "unknown"
      }`
    );
    this.name = "SailRefetchSubscriptionsError";
  }
}

/**
 * Thrown if a cache refetch results in an error.
 */
export class SailCacheRefetchError extends SailError {
  constructor(
    public readonly originalError: unknown,
    public readonly keys: readonly (PublicKey | null | undefined)[]
  ) {
    super(
      `Error refetching from cache: ${
        originalError instanceof Error ? originalError.message : "unknown"
      }`
    );
    this.name = "SailCacheRefetchError";
  }
}

/**
 * Thrown if there is an error parsing an account.
 */
export class SailAccountParseError extends SailError {
  constructor(
    public readonly originalError: unknown,
    public readonly data: KeyedAccountInfo
  ) {
    super(
      `Error parsing account: ${
        originalError instanceof Error ? originalError.message : "unknown"
      }`
    );
    this.name = "SailAccountParseError";
  }
}

/**
 * Thrown if an account could not be loaded.
 */
export class SailAccountLoadError extends SailError {
  constructor(
    public readonly originalError: unknown,
    public readonly accountId: PublicKey
  ) {
    super(
      `Error loading account: ${
        originalError instanceof Error ? originalError.message : "unknown"
      }`
    );
    this.name = "SailAccountLoadError";
  }

  get userMessage(): string {
    return `Error loading account ${this.accountId.toString()}`;
  }
}

/**
 * Callback called whenever getMultipleAccounts fails.
 */
export class SailGetMultipleAccountsError extends SailError {
  constructor(
    public readonly keys: readonly PublicKey[],
    public readonly commitment: Commitment,
    public readonly originalError: unknown
  ) {
    super(
      `GetMultipleAccountsError: ${
        originalError instanceof Error ? originalError.message : "unknown"
      }`
    );
    this.name = "SailGetMultipleAccountsError";
  }
}
