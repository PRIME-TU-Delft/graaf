
<!-- Script -->

<script lang="ts">
    
    import Card from '$components/Card.svelte';
	import Division from '$components/Divider.svelte';
    import Form from '$components/forms/Form.svelte';
	import Row from '$components/forms/Row.svelte';
	import TextInput from '$components/forms/TextInput.svelte';
	import Checkbox from '$components/forms/Checkbox.svelte';

    function SSOlogin(event: Event) {
        // TODO add SSO login event
    }
    
    function login(event: Event) {
        // TODO add login event
    }

</script>

<!-- Markup -->


<div class="login-form">
    <Card>
        <h1 slot="header">Login</h1>
        <div slot="body">
            <Form>
                <Row><p slot="center">Welcome to the Graph editor, here you can assemble your own course graph! From July 1 forward we will be using TU Delft Single Sign-on as our default login procedure. The old accounts will be removed after November 1. You can give yourself access to the courses that your old account had access to. Please take up contact with PRIME@tudelft.nl or your program manager to handle access to other courses.</p></Row>
                <Row><button slot="center" type="submit" on:click={SSOlogin}>Login with TUDelft SSO</button></Row>
            </Form>
            
            <Division />
        
            <Form>
                <TextInput label="Username" />
                <TextInput label="Password" obfuscate={true} />
                <Checkbox label="Remember me" />
                <Row>
                    <div slot="right">
                        <button type="submit" on:click={login}>Login</button>
                        <a href="/auth/recover">Forgot your password?</a>
                    </div>
                </Row>
            </Form>
        </div>
    </Card>
</div>

<!-- Styles -->

<style lang="sass">
    
    @use "$styles/variables.sass"

    .login-form
        max-width: 45rem
        margin: 0 auto

        button
            padding: 0.375rem 0.75rem
    
            border: 1px solid transparent
            border-radius: 0.25rem
            
            color: white
            background-color: variables.$blue            
            transition: all 0.15s ease-in-out
            
            &:hover
                cursor: pointer
                background-color: variables.$dark-blue

        a
            padding: 0.375rem 0.75rem

            color: variables.$blue
            transition: all 0.15s ease-in-out

            &:hover
                cursor: pointer
                text-decoration: underline
                color: variables.$dark-blue 

</style>