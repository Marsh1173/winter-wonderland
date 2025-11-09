import { create_validator, isString, isObject } from "./data/validator";

/**
 * Join game message shared between client and server
 */
export interface JoinGameMessage {
  name: string;
  character_id: string;
}

export const JoinGameMessageValidator = create_validator(
  isObject<JoinGameMessage>({
    name: isString,
    character_id: isString,
  })
);
