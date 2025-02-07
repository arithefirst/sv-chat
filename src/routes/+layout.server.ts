import { db } from '$lib/server/db';
import { newChannelSchema } from '$lib/types/schema';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export async function load() {
  const form = await superValidate(zod(newChannelSchema));
  const rows = await db.getChannels();
  const channels: string[] = rows
    ? rows.map((value) => {
        return value.table_name.replaceAll('_', '-');
      })
    : [];

  return {
    channels,
    form,
  };
}
