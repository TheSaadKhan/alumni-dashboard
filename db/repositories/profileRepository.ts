import { profileQueries } from '../queries/profiles';

export async function findProfile(id: string) {
  return await profileQueries.getProfileById(id);
}
