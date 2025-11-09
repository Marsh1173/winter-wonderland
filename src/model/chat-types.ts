import {
  create_validator,
  isString,
  isNumber,
  isObject,
} from "./data/validator";

/**
 * Chat message shared between client and server
 */
export interface ChatMessage {
  player_id: string;
  player_name: string;
  message: string;
  timestamp: number;
}

/**
 * Validator for ChatMessage objects
 */
export const ChatMessageValidator = create_validator(
  isObject<ChatMessage>({
    player_id: isString,
    player_name: isString,
    message: isString,
    timestamp: isNumber,
  })
);
