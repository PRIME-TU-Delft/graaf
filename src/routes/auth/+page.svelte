<script>
	import { page } from '$app/state';
	import { SignIn, SignOut } from '@auth/sveltekit/components';
</script>

<div class="prose">
	<h1>SvelteKit Auth Example</h1>
	<div>
		{#if page.data.session}
			{#if page.data.session.user?.image}
				<img src={page.data.session.user.image} class="avatar" alt="User Avatar" />
			{/if}
			<span class="signedInText">
				<small>Signed in as</small><br />

				<pre>{JSON.stringify(page.data.session, null, 2)}</pre>

				<strong>{page.data.session.user?.name ?? 'User'}</strong>
			</span>
			<SignOut>
				<div slot="submitButton" class="buttonPrimary">Sign out</div>
			</SignOut>
		{:else}
			<span class="notSignedInText">You are not signed in</span>
			<SignIn>
				<div slot="submitButton" class="buttonPrimary">Sign in</div>
			</SignIn>
		{/if}
	</div>
</div>
