import { characterEntities } from "character-entities"
export function decodeNamedCharacterReference(value) {
  return Object.hasOwn(characterEntities, value) ? characterEntities[value] : false
}
