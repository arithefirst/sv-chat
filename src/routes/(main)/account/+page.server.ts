import { redirect } from '@sveltejs/kit';
import type { Actions } from '@sveltejs/kit';
import { fail, message, setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { auth } from '$lib/server/db/auth';
import { changeUsernameSchema, changePasswordSchema } from '$lib/types/schema.js';
import type { APIError } from 'better-auth/api';

export async function load({ request }) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    redirect(307, '/signup');
  }

  return {
    newuserForm: await superValidate(zod(changeUsernameSchema)),
    newpassForm: await superValidate(zod(changePasswordSchema)),
  };
}

export const actions = {
  updatePassword: async ({ request }) => {
    const newpassForm = await superValidate(request, zod(changePasswordSchema));

    try {
      if (!newpassForm.valid) {
        return fail(400, { newpassForm });
      }

      await auth.api.changePassword({
        headers: request.headers,
        body: {
          newPassword: newpassForm.data.newPassword,
          currentPassword: newpassForm.data.currentPassword,
          revokeOtherSessions: false,
        },
      });
    } catch (e) {
      const errorMessage = (e as APIError).body.message as string;
      if ((e as APIError).body.code === 'INVALID_PASSWORD') {
        return setError(newpassForm, 'currentPassword', errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1));
      } else {
        return setError(newpassForm, 'newPassword', errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1));
      }
    }

    return message(newpassForm, 'Password updated.');
  },
  updateUsername: async ({ request }) => {
    const newuserForm = await superValidate(request, zod(changeUsernameSchema));

    if (!newuserForm.valid) {
      return fail(400, { newuserForm });
    }

    return message(newuserForm, 'Username updated.');
  },
  updateProfilePhoto: async () => {},
  deleteAccount: async ({ request }) => {
    auth.api.deleteUser({
      headers: request.headers,
      body: {},
    });

    redirect(303, '/goodbye');
  },
  signOut: async ({ request }) => {
    auth.api.signOut({
      headers: request.headers,
    });

    redirect(303, '/login');
  },
} satisfies Actions;
