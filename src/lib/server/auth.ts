import { SvelteKitAuth } from "@auth/sveltekit";
import { PrismaAdapter } from "@auth/prisma-adapter";

import prisma from "$lib/server/prisma";
import { env } from "$env/dynamic/private";
import type { OIDCConfig } from "@auth/sveltekit/providers";


interface SurfConextProfile extends Record<string, any> {
	email: string;
	email_verified: boolean;
	name: string;
	nickname: string;
	preferred_username: string;
	given_name: string;
	family_name: string;
}


function SurfConextProvider<P extends SurfConextProfile>(): OIDCConfig<P> {
	return {
		id: "surfconext",
		name: "SURFconext",
		type: "oidc",
		issuer: env.SURFCONEXT_ISSUER,
		wellKnown: "https://connect.test.surfconext.nl/.well-known/openid-configuration",
		clientId: env.SURFCONEXT_CLIENT_ID,
		clientSecret: env.SURFCONEXT_CLIENT_SECRET,
	};
}


export const { handle, signIn, signOut } = SvelteKitAuth({
	providers: [SurfConextProvider],
	adapter: PrismaAdapter(prisma),
	secret: env.AUTH_SECRET,
	debug: Boolean(env.DEBUG),
	// trustHost: true
});
