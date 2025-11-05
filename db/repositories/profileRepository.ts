import * as q from '../queries/profiles';

export async function findProfile(id: string) {
  return await q.getProfileById(id);
}
