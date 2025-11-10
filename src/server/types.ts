/**
 * Connection request parameters
 */
export interface ConnectParams {
  name: string;
  character_id: string;
}

/**
 * Validation result
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
    }

/**
 * Validate connection parameters
 */
export function validate_connect_params(searchParams: URLSearchParams): ValidationResult<ConnectParams> {
  const name = searchParams.get("name");
  const character_id = searchParams.get("character_id");

  // Check for missing params
  if (!name) {
    return {
      success: false,
      error: "Missing required parameter: name",
    };
  }

  if (!character_id) {
    return {
      success: false,
      error: "Missing required parameter: character_id",
    };
  }

  // Validate name
  const trimmed_name = name.trim();
  if (trimmed_name.length === 0) {
    return {
      success: false,
      error: "Name cannot be empty",
    };
  }

  if (trimmed_name.length > 50) {
    return {
      success: false,
      error: "Name must be 50 characters or less",
    };
  }

  // Validate character_id format (should be like "female-b", "male-a", etc.)
  const character_id_pattern = /^(female|male)-(a|b|c|d|e|f)$/i;
  if (!character_id_pattern.test(character_id)) {
    return {
      success: false,
      error: "Invalid character_id format",
    };
  }

  return {
    success: true,
    data: {
      name: trimmed_name,
      character_id: character_id.toLowerCase(),
    },
  };
}
