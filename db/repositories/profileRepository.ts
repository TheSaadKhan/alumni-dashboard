import profileQueries from "../queries/profiles";


/**
 * Find a profile by its internal profile ID.
 * Returns `null` if not found.
 */
export async function findProfile(id: string) {
  if (!id) return null;
  return await profileQueries.getProfileById(id);
}

export default findProfile;
