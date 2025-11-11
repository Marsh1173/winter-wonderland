export interface Character {
  id: string;
  name: string;
}

export const CHARACTERS: Character[] = [
  { id: "female-b", name: "Aurora" },
  { id: "female-c", name: "Ivy" },
  { id: "female-d", name: "Sage" },
  { id: "female-e", name: "Luna" },
  { id: "female-f", name: "Nova" },
  { id: "male-a", name: "Felix" },
  { id: "male-b", name: "Jasper" },
  { id: "male-d", name: "Kai" },
  { id: "male-e", name: "Orion" },
  { id: "male-f", name: "Silas" },
];

export function get_character_preview_url(character: Character): string {
  return `/assets/character_previews/character-${character.id}.png`;
}

export function get_character_model_url(character_id: string): string {
  return `/assets/character_models/character-${character_id}.glb`;
}
