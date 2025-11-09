import { describe, it, expect } from "bun:test";
import {
  create_validator,
  isString,
  isNumber,
  isBoolean,
  isArray,
  isOptional,
  isObject,
  isLiteral,
  isUnion,
  type Extract,
} from "./validator";

describe("Validator API", () => {
  describe("Basic types", () => {
    it("should validate strings", () => {
      const validator = create_validator(isString);
      expect(validator.validate('"hello"')).toBe(true);
      expect(validator.validate('"123"')).toBe(true);
      expect(validator.validate("123")).toBe(false);
    });

    it("should validate numbers", () => {
      const validator = create_validator(isNumber);
      expect(validator.validate("123")).toBe(true);
      expect(validator.validate("45.67")).toBe(true);
      expect(validator.validate('"123"')).toBe(false);
    });

    it("should validate booleans", () => {
      const validator = create_validator(isBoolean);
      expect(validator.validate("true")).toBe(true);
      expect(validator.validate("false")).toBe(true);
      expect(validator.validate('"true"')).toBe(false);
    });
  });

  describe("Parse functionality", () => {
    it("should parse string from JSON", () => {
      const validator = create_validator(isString);
      const result = validator.parse('"hello"');
      expect(result).toBe("hello");
    });

    it("should parse number from JSON", () => {
      const validator = create_validator(isNumber);
      const result = validator.parse("42");
      expect(result).toBe(42);
    });

    it("should throw on invalid parse", () => {
      const validator = create_validator(isString);
      expect(() => validator.parse("123")).toThrow();
    });
  });

  describe("Object validation", () => {
    it("should validate simple objects", () => {
      const PersonValidator = create_validator(
        isObject<{ name: string; age: number }>({
          name: isString,
          age: isNumber,
        })
      );

      expect(PersonValidator.validate('{"name":"Alice","age":30}')).toBe(true);
      expect(PersonValidator.validate('{"name":"Alice","age":"30"}')).toBe(false);
      expect(PersonValidator.validate('{"name":"Alice"}')).toBe(false);
    });

    it("should parse objects correctly", () => {
      const PersonValidator = create_validator(
        isObject<{ name: string; age: number }>({
          name: isString,
          age: isNumber,
        })
      );

      const person = PersonValidator.parse('{"name":"Alice","age":30}');
      expect(person.name).toBe("Alice");
      expect(person.age).toBe(30);
    });
  });

  describe("Optional fields", () => {
    it("should allow missing optional fields", () => {
      const PersonValidator = create_validator(
        isObject<{ name: string; nickname?: string }>({
          name: isString,
          nickname: isOptional(isString),
        })
      );

      expect(PersonValidator.validate('{"name":"Alice"}')).toBe(true);
      const person = PersonValidator.parse('{"name":"Alice"}');
      expect(person.name).toBe("Alice");
      expect(person.nickname).toBeUndefined();
    });

    it("should include optional fields when provided", () => {
      const PersonValidator = create_validator(
        isObject<{ name: string; nickname?: string }>({
          name: isString,
          nickname: isOptional(isString),
        })
      );

      const person = PersonValidator.parse('{"name":"Alice","nickname":"Ally"}');
      expect(person.nickname).toBe("Ally");
    });
  });

  describe("Arrays", () => {
    it("should validate array of strings", () => {
      const validator = create_validator(isArray(isString));
      expect(validator.validate('["a","b","c"]')).toBe(true);
      expect(validator.validate("[1,2,3]")).toBe(false);
      expect(validator.validate('"not-array"')).toBe(false);
    });

    it("should validate array of numbers", () => {
      const validator = create_validator(isArray(isNumber));
      expect(validator.validate("[1,2,3]")).toBe(true);
      expect(validator.validate('["a","b"]')).toBe(false);
    });

    it("should parse arrays correctly", () => {
      const validator = create_validator(isArray(isString));
      const result = validator.parse('["red","green","blue"]');
      expect(result).toEqual(["red", "green", "blue"]);
    });

    it("should validate array of objects", () => {
      const validator = create_validator(
        isArray(
          isObject<{ name: string; age: number }>({
            name: isString,
            age: isNumber,
          })
        )
      );

      expect(validator.validate('[{"name":"Alice","age":30},{"name":"Bob","age":25}]')).toBe(true);
      expect(validator.validate('[{"name":"Alice","age":"30"},{"name":"Bob","age":25}]')).toBe(false);
    });
  });

  describe("Serialization", () => {
    it("should serialize objects to JSON", () => {
      const PersonValidator = create_validator(
        isObject<{ name: string; age: number }>({
          name: isString,
          age: isNumber,
        })
      );

      const person = { name: "Alice", age: 30 };
      const json = PersonValidator.serialize(person);
      expect(json).toBe('{"name":"Alice","age":30}');
    });

    it("should roundtrip serialize/deserialize", () => {
      const PersonValidator = create_validator(
        isObject<{ name: string; age: number; tags: string[] }>({
          name: isString,
          age: isNumber,
          tags: isArray(isString),
        })
      );

      const original = { name: "Alice", age: 30, tags: ["admin", "user"] };
      const json = PersonValidator.serialize(original);
      const restored = PersonValidator.parse(json);

      expect(restored).toEqual(original);
    });
  });

  describe("Type extraction", () => {
    it("should extract type from validator", () => {
      const PersonValidator = create_validator(
        isObject<{ name: string; age: number }>({
          name: isString,
          age: isNumber,
        })
      );

      type Person = Extract<typeof PersonValidator>;
      const person: Person = { name: "Alice", age: 30 };
      expect(person.name).toBe("Alice");
      expect(person.age).toBe(30);
    });
  });

  describe("Error handling", () => {
    it("should validate_with_error on success", () => {
      const validator = create_validator(isString);
      const result = validator.validate_with_error('"hello"');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should validate_with_error on failure", () => {
      const validator = create_validator(isString);
      const result = validator.validate_with_error("123");
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("Expected string");
    });

    it("should validate_object for plain objects", () => {
      const PersonValidator = create_validator(
        isObject<{ name: string; age: number }>({
          name: isString,
          age: isNumber,
        })
      );

      expect(PersonValidator.validate_object({ name: "Alice", age: 30 })).toBe(true);
      expect(PersonValidator.validate_object({ name: "Alice", age: "30" })).toBe(false);
    });

    it("should parse_object for plain objects", () => {
      const PersonValidator = create_validator(
        isObject<{ name: string; age: number }>({
          name: isString,
          age: isNumber,
        })
      );

      const person = PersonValidator.parse_object({ name: "Alice", age: 30 });
      expect(person.name).toBe("Alice");
      expect(person.age).toBe(30);
    });
  });

  describe("Complex nested structures", () => {
    it("should handle deeply nested objects", () => {
      const GameStateValidator = create_validator(
        isObject<{
          players: Array<{
            id: string;
            position: { x: number; y: number; z: number };
          }>;
          timestamp: number;
        }>({
          players: isArray(
            isObject<{
              id: string;
              position: { x: number; y: number; z: number };
            }>({
              id: isString,
              position: isObject<{ x: number; y: number; z: number }>({
                x: isNumber,
                y: isNumber,
                z: isNumber,
              }),
            })
          ),
          timestamp: isNumber,
        })
      );

      const json = JSON.stringify({
        players: [
          { id: "p1", position: { x: 10, y: 5, z: 20 } },
          { id: "p2", position: { x: 15, y: 5, z: 25 } },
        ],
        timestamp: Date.now(),
      });

      expect(GameStateValidator.validate(json)).toBe(true);
      const state = GameStateValidator.parse(json);
      expect(state.players).toHaveLength(2);
      expect(state.players[0]!.position.x).toBe(10);
    });
  });

  describe("Real-world example: Person", () => {
    it("should create a Person validator", () => {
      const PersonValidator = create_validator(
        isObject<{
          name: string;
          age: number;
          email: string;
          phone?: string;
          hobbies: string[];
        }>({
          name: isString,
          age: isNumber,
          email: isString,
          phone: isOptional(isString),
          hobbies: isArray(isString),
        })
      );

      type Person = Extract<typeof PersonValidator>;

      const json = JSON.stringify({
        name: "Alice",
        age: 30,
        email: "alice@example.com",
        phone: "555-1234",
        hobbies: ["reading", "hiking", "coding"],
      });

      expect(PersonValidator.validate(json)).toBe(true);
      const person = PersonValidator.parse(json);

      expect(person.name).toBe("Alice");
      expect(person.age).toBe(30);
      expect(person.hobbies).toHaveLength(3);
      expect(person.phone).toBe("555-1234");

      // Re-serialize
      const reserialized = PersonValidator.serialize(person);
      expect(PersonValidator.validate(reserialized)).toBe(true);
    });
  });

  describe("Literal types", () => {
    it("should validate literal string", () => {
      const validator = create_validator(isLiteral("admin"));
      expect(validator.validate('"admin"')).toBe(true);
      expect(validator.validate('"user"')).toBe(false);
      expect(validator.validate('"Admin"')).toBe(false);
    });

    it("should validate literal number", () => {
      const validator = create_validator(isLiteral(42));
      expect(validator.validate("42")).toBe(true);
      expect(validator.validate("41")).toBe(false);
      expect(validator.validate('"42"')).toBe(false);
    });

    it("should validate literal boolean", () => {
      const validator = create_validator(isLiteral(true));
      expect(validator.validate("true")).toBe(true);
      expect(validator.validate("false")).toBe(false);
    });

    it("should parse literal values", () => {
      const validator = create_validator(isLiteral("active"));
      const result = validator.parse('"active"');
      expect(result).toBe("active");
    });

    it("should throw on wrong literal value", () => {
      const validator = create_validator(isLiteral("admin"));
      expect(() => validator.parse('"user"')).toThrow();
    });

    it("should use literals in objects for discriminated unions", () => {
      const UserValidator = create_validator(
        isObject<{ type: "user"; name: string }>({
          type: isLiteral("user"),
          name: isString,
        })
      );

      expect(UserValidator.validate('{"type":"user","name":"Alice"}')).toBe(true);
      expect(UserValidator.validate('{"type":"admin","name":"Alice"}')).toBe(false);

      const user = UserValidator.parse_object({ type: "user", name: "Alice" });
      expect(user.type).toBe("user");
    });
  });

  describe("Union types", () => {
    it("should validate union of strings and numbers", () => {
      const validator = create_validator(isUnion(isString, isNumber));
      expect(validator.validate('"hello"')).toBe(true);
      expect(validator.validate("42")).toBe(true);
      expect(validator.validate("true")).toBe(false);
    });

    it("should validate union of literals", () => {
      const validator = create_validator(isUnion(isLiteral("admin"), isLiteral("user"), isLiteral("guest")));
      expect(validator.validate('"admin"')).toBe(true);
      expect(validator.validate('"user"')).toBe(true);
      expect(validator.validate('"guest"')).toBe(true);
      expect(validator.validate('"moderator"')).toBe(false);
    });

    it("should parse union and return correct type", () => {
      const validator = create_validator(isUnion(isString, isNumber));
      const str = validator.parse('"hello"');
      expect(str).toBe("hello");
      expect(typeof str).toBe("string");

      const num = validator.parse("42");
      expect(num).toBe(42);
      expect(typeof num).toBe("number");
    });

    it("should validate union of objects (discriminated union)", () => {
      const validator = create_validator(
        isUnion(
          isObject<{ type: "user"; name: string }>({
            type: isLiteral("user"),
            name: isString,
          }),
          isObject<{ type: "admin"; role: string }>({
            type: isLiteral("admin"),
            role: isString,
          })
        )
      );

      expect(validator.validate('{"type":"user","name":"Alice"}')).toBe(true);
      expect(validator.validate('{"type":"admin","role":"superadmin"}')).toBe(true);
      expect(validator.validate('{"type":"guest"}')).toBe(false);
    });

    it("should parse discriminated union objects", () => {
      const validator = create_validator(
        isUnion(
          isObject<{ type: "user"; name: string }>({
            type: isLiteral("user"),
            name: isString,
          }),
          isObject<{ type: "admin"; role: string }>({
            type: isLiteral("admin"),
            role: isString,
          })
        )
      );

      const user_json = '{"type":"user","name":"Alice"}';
      const user = validator.parse(user_json);
      expect(user.type).toBe("user");
      expect("name" in user && user.name).toBe("Alice");

      const admin_json = '{"type":"admin","role":"superadmin"}';
      const admin = validator.parse(admin_json);
      expect(admin.type).toBe("admin");
      expect("role" in admin && admin.role).toBe("superadmin");
    });

    it("should throw on union with no matching types", () => {
      const validator = create_validator(isUnion(isString, isNumber));
      expect(() => validator.parse("true")).toThrow();
    });

    it("should handle complex union with literals in array", () => {
      const validator = create_validator(
        isArray(isUnion(isLiteral("success"), isLiteral("error"), isLiteral("pending")))
      );

      expect(validator.validate('["success","error","pending","success"]')).toBe(true);
      expect(validator.validate('["success","unknown"]')).toBe(false);

      const statuses = validator.parse('["success","error","pending"]');
      expect(statuses).toEqual(["success", "error", "pending"]);
    });
  });

  describe("Real-world: Discriminated union with literals", () => {
    it("should handle WebSocket message types", () => {
      type Message =
        | { type: "chat"; player: string; text: string }
        | { type: "ping"; id: number }
        | { type: "position"; x: number; y: number };

      const MessageValidator = create_validator(
        isUnion(
          isObject<{ type: "chat"; player: string; text: string }>({
            type: isLiteral("chat"),
            player: isString,
            text: isString,
          }),
          isObject<{ type: "ping"; id: number }>({
            type: isLiteral("ping"),
            id: isNumber,
          }),
          isObject<{ type: "position"; x: number; y: number }>({
            type: isLiteral("position"),
            x: isNumber,
            y: isNumber,
          })
        )
      );

      // Chat message
      const chat_json = '{"type":"chat","player":"Alice","text":"Hello!"}';
      expect(MessageValidator.validate(chat_json)).toBe(true);
      const chat = MessageValidator.parse(chat_json);
      expect(chat.type).toBe("chat");

      // Ping message
      const ping_json = '{"type":"ping","id":123}';
      expect(MessageValidator.validate(ping_json)).toBe(true);
      const ping = MessageValidator.parse(ping_json);
      expect(ping.type).toBe("ping");
      expect("id" in ping && ping.id).toBe(123);

      // Position message
      const pos_json = '{"type":"position","x":10,"y":20}';
      expect(MessageValidator.validate(pos_json)).toBe(true);
      const pos = MessageValidator.parse(pos_json);
      expect(pos.type).toBe("position");
      expect("x" in pos && pos.x).toBe(10);

      // Invalid message type
      expect(MessageValidator.validate('{"type":"unknown"}')).toBe(false);
    });
  });
});
