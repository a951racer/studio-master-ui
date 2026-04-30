/**
 * Returns the display name for a Person.
 * Uses preferredName when set (non-null, non-empty), otherwise firstName + ' ' + lastName.
 */
export function getDisplayName(person: {
  firstName: string;
  lastName: string;
  preferredName?: string | null;
}): string {
  if (person.preferredName != null && person.preferredName.trim() !== '') {
    return person.preferredName;
  }
  return `${person.firstName} ${person.lastName}`;
}
