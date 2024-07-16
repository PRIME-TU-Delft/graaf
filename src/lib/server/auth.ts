import { SvelteKitAuth } from "@auth/sveltekit";
import { type Provider } from "@auth/sveltekit/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";

import prisma from "$lib/server/prisma";
import { env } from "$env/dynamic/private";


const surfProvider: Provider = {
	id: "surfconext",
	name: "SURFconext",
	type: "oidc",
	issuer: env.SURFCONEXT_ISSUER,
	clientId: env.SURFCONEXT_CLIENT_ID,
	clientSecret: env.SURFCONEXT_CLIENT_SECRET,
};


export const { handle, signIn, signOut } = SvelteKitAuth({
	providers: [surfProvider],
	adapter: PrismaAdapter(prisma),
	secret: env.AUTH_SECRET,
	// trustHost: true
});
