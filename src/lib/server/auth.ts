import { env } from '$env/dynamic/private';
import prisma from '$lib/server/db/prisma';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { SvelteKitAuth } from '@auth/sveltekit';
import { error } from '@sveltejs/kit';

import type { OIDCConfig } from '@auth/sveltekit/providers';

interface SurfConextProfile extends Record<string, string> {
	nickname: string;
	firstName: string;
	lastName: string;
	email: string;
}

/**
 * Workaround for Auth.js not automatically fetching userinfo through endpoint specified in .well-known config
 *
 * @param accessToken JWT access token
 * @returns Object containing user information
 */

async function fetchUserInfo(accessToken: string | undefined) {
	if (!accessToken) throw error(505, 'No access token provided');
	const res = await fetch(`${env.SURFCONEXT_ISSUER}/oidc/userinfo`, {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});
	return await res.json();
}

function SurfConextProvider<P extends SurfConextProfile>(): OIDCConfig<P> {
	return {
		id: 'surfconext',
		name: 'SURFconext',
		type: 'oidc',
		issuer: env.SURFCONEXT_ISSUER,
		wellKnown: `${env.SURFCONEXT_ISSUER}/.well-known/openid-configuration`,
		clientId: env.SURFCONEXT_CLIENT_ID,
		clientSecret: env.SURFCONEXT_CLIENT_SECRET,
		allowDangerousEmailAccountLinking: true, // Not sure if this is safe @juliavdkris

		async profile(profile, tokens): Promise<SurfConextProfile> {
			const userInfo = await fetchUserInfo(tokens.access_token);
			const res = {
				nickname: userInfo.nickname,
				firstName: userInfo.given_name,
				lastName: userInfo.family_name,
				email: userInfo.email
			};
			return res;
		}
	};
}

export const { handle, signIn, signOut } = SvelteKitAuth({
	providers: [SurfConextProvider],
	adapter: PrismaAdapter(prisma),
	secret: env.AUTH_SECRET,
	debug: Boolean(env.DEBUG),
	trustHost: true,

	callbacks: {
		// ¯\_(ツ)_/¯
		// ¯\_(ツ)_/¯ - bram
		session({ session }) {
			return session;
		}
	}
});
