/**
 * Type-safe schema validation system
 * Enables compile-time and runtime type checking for serialization/deserialization
 */

export class ValidationError extends Error {
  constructor(public path: string, public value: any, message: string) {
    super(`${path}: ${message}`);
    this.name = "ValidationError";
  }
}

// ============================================
// Type Descriptors (the building blocks)
// ============================================

abstract class TypeDescriptor<T> {
  abstract validate(value: any): boolean;
  abstract parse(value: any): T;
  abstract error_message(): string;
}

class StringDescriptor extends TypeDescriptor<string> {
  validate(value: any): boolean {
    return typeof value === "string";
  }
  parse(value: any): string {
    if (!this.validate(value)) throw new Error("Expected string");
    return value;
  }
  error_message(): string {
    return "Expected string";
  }
}

class NumberDescriptor extends TypeDescriptor<number> {
  validate(value: any): boolean {
    return typeof value === "number" && !isNaN(value);
  }
  parse(value: any): number {
    if (!this.validate(value)) throw new Error("Expected number");
    return value;
  }
  error_message(): string {
    return "Expected number";
  }
}

class BooleanDescriptor extends TypeDescriptor<boolean> {
  validate(value: any): boolean {
    return typeof value === "boolean";
  }
  parse(value: any): boolean {
    if (!this.validate(value)) throw new Error("Expected boolean");
    return value;
  }
  error_message(): string {
    return "Expected boolean";
  }
}

class ArrayDescriptor<T> extends TypeDescriptor<T[]> {
  constructor(private item_descriptor: TypeDescriptor<T>) {
    super();
  }
  validate(value: any): boolean {
    if (!Array.isArray(value)) return false;
    return value.every((item) => this.item_descriptor.validate(item));
  }
  parse(value: any): T[] {
    if (!Array.isArray(value)) throw new Error("Expected array");
    return value.map((item, index) => {
      try {
        return this.item_descriptor.parse(item);
      } catch (e) {
        throw new Error(`[${index}]: ${e}`);
      }
    });
  }
  error_message(): string {
    return `Expected array of ${this.item_descriptor.error_message()}`;
  }
}

class OptionalDescriptor<T> extends TypeDescriptor<T | undefined> {
  constructor(private inner_descriptor: TypeDescriptor<T>) {
    super();
  }
  validate(value: any): boolean {
    if (value === undefined) return true;
    return this.inner_descriptor.validate(value);
  }
  parse(value: any): T | undefined {
    if (value === undefined) return undefined;
    return this.inner_descriptor.parse(value);
  }
  error_message(): string {
    return `${this.inner_descriptor.error_message()} or undefined`;
  }
}

class ObjectDescriptor<T extends Record<string, any>> extends TypeDescriptor<T> {
  constructor(private descriptors: { [K in keyof T]: TypeDescriptor<T[K]> }) {
    super();
  }

  validate(value: any): boolean {
    if (typeof value !== "object" || value === null) return false;
    for (const [key, descriptor] of Object.entries(this.descriptors)) {
      if (!descriptor.validate(value[key])) return false;
    }
    return true;
  }

  parse(value: any): T {
    if (typeof value !== "object" || value === null) {
      throw new Error("Expected object");
    }

    const result: any = {};
    for (const [key, descriptor] of Object.entries(this.descriptors)) {
      if (value[key] === undefined) {
        if (descriptor instanceof OptionalDescriptor) {
          result[key] = undefined;
          continue;
        }
        throw new Error(`Missing required field: ${key}`);
      }
      try {
        result[key] = descriptor.parse(value[key]);
      } catch (e) {
        throw new Error(`${key}: ${e}`);
      }
    }
    return result as T;
  }

  error_message(): string {
    return "Expected object";
  }
}

class LiteralDescriptor<T extends string | number | boolean> extends TypeDescriptor<T> {
  constructor(private literal_value: T) {
    super();
  }

  validate(value: any): boolean {
    return value === this.literal_value;
  }

  parse(value: any): T {
    if (!this.validate(value)) {
      throw new Error(`Expected literal ${JSON.stringify(this.literal_value)}`);
    }
    return value as T;
  }

  error_message(): string {
    return `Expected literal ${JSON.stringify(this.literal_value)}`;
  }
}

class UnionDescriptor<T> extends TypeDescriptor<T> {
  constructor(private descriptors: TypeDescriptor<any>[]) {
    super();
  }

  validate(value: any): boolean {
    return this.descriptors.some((descriptor) => descriptor.validate(value));
  }

  parse(value: any): T {
    const errors: string[] = [];
    for (const descriptor of this.descriptors) {
      try {
        return descriptor.parse(value) as T;
      } catch (e) {
        errors.push(String(e));
      }
    }
    throw new Error(`No matching union type. Errors: ${errors.join(" | ")}`);
  }

  error_message(): string {
    return `Union of (${this.descriptors.map((d) => d.error_message()).join(" | ")})`;
  }
}

// ============================================
// Public Type Descriptors (exported)
// ============================================

export const isString = new StringDescriptor();
export const isNumber = new NumberDescriptor();
export const isBoolean = new BooleanDescriptor();

export function isArray<T>(item_descriptor: TypeDescriptor<T>): TypeDescriptor<T[]> {
  return new ArrayDescriptor(item_descriptor);
}

export function isOptional<T>(descriptor: TypeDescriptor<T>): TypeDescriptor<T | undefined> {
  return new OptionalDescriptor(descriptor);
}

export function isObject<T extends Record<string, any>>(
  descriptors: { [K in keyof T]: TypeDescriptor<T[K]> }
): TypeDescriptor<T> {
  return new ObjectDescriptor(descriptors);
}

export function isLiteral<T extends string | number | boolean>(
  value: T
): TypeDescriptor<T> {
  return new LiteralDescriptor(value);
}

export function isUnion<T extends readonly TypeDescriptor<any>[]>(
  ...descriptors: T
): TypeDescriptor<T[number] extends TypeDescriptor<infer U> ? U : never> {
  return new UnionDescriptor(descriptors) as any;
}

// ============================================
// Validator (main API)
// ============================================

export interface Validator<T> {
  /** Type-safe way to extract the type from the validator */
  __type?: T;

  /** Check if JSON string is valid */
  validate(json: string): boolean;

  /** Parse JSON string or throw ValidationError */
  parse(json: string): T;

  /** Serialize object to JSON string */
  serialize(obj: T): string;

  /** Validate with detailed error info */
  validate_with_error(json: string): { valid: boolean; error?: ValidationError };

  /** Validate plain object */
  validate_object(obj: any): boolean;

  /** Parse plain object or throw ValidationError */
  parse_object(obj: any): T;
}

export function create_validator<T>(descriptor: TypeDescriptor<T>): Validator<T> {
  return {
    __type: undefined as any,

    validate(json: string): boolean {
      try {
        const obj = JSON.parse(json);
        return descriptor.validate(obj);
      } catch {
        return false;
      }
    },

    parse(json: string): T {
      try {
        const obj = JSON.parse(json);
        return descriptor.parse(obj);
      } catch (error) {
        throw new ValidationError("root", json, String(error));
      }
    },

    serialize(obj: T): string {
      return JSON.stringify(obj);
    },

    validate_with_error(json: string): { valid: boolean; error?: ValidationError } {
      try {
        const obj = JSON.parse(json);
        descriptor.parse(obj);
        return { valid: true };
      } catch (error) {
        if (error instanceof ValidationError) {
          return { valid: false, error };
        }
        return { valid: false, error: new ValidationError("root", json, String(error)) };
      }
    },

    validate_object(obj: any): boolean {
      return descriptor.validate(obj);
    },

    parse_object(obj: any): T {
      try {
        return descriptor.parse(obj);
      } catch (error) {
        throw new ValidationError("root", obj, String(error));
      }
    },
  };
}

// ============================================
// Type extraction helper
// ============================================

/**
 * Extract the type from a Validator
 * Usage: type Person = Extract<typeof PersonValidator>;
 */
export type Extract<T> = T extends Validator<infer U> ? U : never;
