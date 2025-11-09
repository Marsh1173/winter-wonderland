# Validator Usage Guide

A type-safe serialization/deserialization system for network messages.

## Quick Start

```typescript
import {
  create_validator,
  isString,
  isNumber,
  isObject,
  isArray,
  isOptional,
  isLiteral,
  isUnion,
  Extract
} from "./validator";

// Define your validator
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

// Extract the type
type Person = Extract<typeof PersonValidator>;

// Use it!
const is_valid: boolean = PersonValidator.validate(json_string);
const person: Person = PersonValidator.parse(json_string);
const json: string = PersonValidator.serialize(person);
```

## API Methods

### `validate(json: string): boolean`
Quick check if JSON is valid without throwing.

```typescript
if (PersonValidator.validate(raw_json)) {
  console.log("Valid person data");
}
```

### `parse(json: string): T`
Parse JSON and throw `ValidationError` if invalid.

```typescript
const person = PersonValidator.parse(json_from_network);
// person is fully typed as Person
```

### `serialize(obj: T): string`
Convert object to JSON string.

```typescript
const json = PersonValidator.serialize(person);
ws.send(json); // Safe to send!
```

### `validate_object(obj: any): boolean`
Validate a plain JavaScript object.

```typescript
const obj = { name: "Alice", age: 30, ... };
if (PersonValidator.validate_object(obj)) {
  // Safe to use
}
```

### `parse_object(obj: any): T`
Parse a plain object with type checking.

```typescript
const person = PersonValidator.parse_object(raw_obj);
```

### `validate_with_error(json: string): { valid: boolean; error?: ValidationError }`
Get detailed error info.

```typescript
const result = PersonValidator.validate_with_error(json);
if (!result.valid) {
  console.error(`Validation failed at ${result.error?.path}`);
}
```

## Type Descriptors

### Basic Types
- `isString` - Matches any string
- `isNumber` - Matches any number (not NaN)
- `isBoolean` - Matches true/false

### Literal Types
- `isLiteral("value")` - Exact string match (e.g., `isLiteral("admin")`)
- `isLiteral(42)` - Exact number match
- `isLiteral(true)` - Exact boolean match

### Collections
- `isArray(descriptor)` - Array of items matching descriptor
- `isObject<T>({ key: descriptor, ... })` - Object with typed fields

### Union Types
- `isUnion(descriptor1, descriptor2, ...)` - One of multiple validators must succeed

### Modifiers
- `isOptional(descriptor)` - Make field optional (can be undefined)

## Real-World Example

```typescript
// Chat message validation
const ChatMessageValidator = create_validator(
  isObject<ChatMessage>({
    player_id: isString,
    player_name: isString,
    message: isString,
    timestamp: isNumber,
  })
);

// In WebSocket message handler
function handle_message(raw_data: string) {
  if (!ChatMessageValidator.validate(raw_data)) {
    console.error("Invalid chat message format");
    return;
  }

  const chat_msg = ChatMessageValidator.parse(raw_data);
  console.log(`${chat_msg.player_name}: ${chat_msg.message}`);
}
```

## Complex Nested Example

```typescript
const GameStateValidator = create_validator(
  isObject<{
    players: Array<{ id: string; position: { x: number; y: number } }>;
    timestamp: number;
  }>({
    players: isArray(
      isObject<{ id: string; position: { x: number; y: number } }>({
        id: isString,
        position: isObject<{ x: number; y: number }>({
          x: isNumber,
          y: isNumber,
        }),
      })
    ),
    timestamp: isNumber,
  })
);

type GameState = Extract<typeof GameStateValidator>;
const state = GameStateValidator.parse(json);
// state is fully typed!
```

## Benefits

✅ Runtime validation + compile-time type safety
✅ Self-documenting - schema is right in the code
✅ No codegen or reflection needed
✅ Detailed error messages
✅ Zero dependencies
✅ Tiny bundle size

## Discriminated Unions with Literals

Perfect for WebSocket message types:

```typescript
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

// Use it!
const msg = MessageValidator.parse(json_from_network);
if (msg.type === "chat") {
  console.log(`${msg.player}: ${msg.text}`);
} else if (msg.type === "ping") {
  console.log(`Ping from ${msg.id}`);
} else if (msg.type === "position") {
  console.log(`Position: ${msg.x}, ${msg.y}`);
}
```

## Role-based Access

```typescript
const UserValidator = create_validator(
  isObject<{ name: string; role: "admin" | "user" | "guest" }>({
    name: isString,
    role: isUnion(
      isLiteral("admin"),
      isLiteral("user"),
      isLiteral("guest")
    ),
  })
);

const user = UserValidator.parse(json);
// user.role is typed as "admin" | "user" | "guest"
```

## Error Handling

```typescript
try {
  const person = PersonValidator.parse(untrusted_json);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`${error.path}: ${error.message}`);
    console.error(`Received value: ${error.value}`);
  }
}
```
