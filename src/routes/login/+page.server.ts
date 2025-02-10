import { dev } from '$app/environment';
import { auth } from '$lib/server/db/auth';
import { loginSchema } from '$lib/types/schema';
import { fail, message, setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions } from './$types';

export const load = async () => {
  const form = await superValidate(zod(loginSchema));
  return { form };
};

export const actions = {
  login: async ({ request, cookies }) => {
    const form = await superValidate(request, zod(loginSchema));
    const email = form.data.email;
    const password = form.data.password;

    if (!form.valid) {
      return fail(400, { form });
    }

    const signin = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      asResponse: true,
    });

    const setCookieHeader = signin.headers.get('set-cookie');
    if (setCookieHeader) {
      const parsedCookie = setCookieHeader.split(';')[0];
      const [name, encodedValue] = parsedCookie.split('=');
      // need to decode it first
      const decodedValue = decodeURIComponent(encodedValue);
      cookies.set(name, decodedValue, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 604800,
        secure: !dev,
      });
    } else {
      return setError(form, 'password', 'Invalid email or password', {
        status: 401,
      });
    }

    return message(form, 'Successfuly signed in.');
  },
} satisfies Actions;
