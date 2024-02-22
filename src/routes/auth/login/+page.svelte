
<!-- Script -->

<script lang="ts">
    
    import Card from '$components/Card.svelte';
    import Form from '$components/Form.svelte';
	import Row from '$components/Row.svelte';
    import Text from '$components/Text.svelte';
	import Textfield from '$components/Textfield.svelte';
	import Checkbox from '$components/Checkbox.svelte';
    import ButtonSubmit from '$components/ButtonSubmit.svelte';
    import ButtonLink from '$components/ButtonLink.svelte';
	import Division from '$components/Division.svelte';

</script>

<!-- Markup -->

<Card header="Login">
    <Form removeMargin={false}>
        <Text content="Welcome to the Graph editor, here you can assemble your own course graph! From July 1 forward we will be using TU Delft Single Sign-on as our default login procedure. The old accounts will be removed after November 1. You can give yourself access to the courses that your old account had access to. Please take up contact with PRIME@tudelft.nl or your program manager to handle access to other courses." />
        <ButtonSubmit label="Login with TUDelft SSO" />
    </Form>
    
    <Division />

    <Form>
        <Textfield label="Username" />
        <Textfield label="Password" obfuscate={true} />
        <Checkbox label="Remember me" />
        <Row>
            <div slot="right">
                <ButtonSubmit label="Login" />
                <ButtonLink label="Forgot Your Password?" href="/auth/recover" />
            </div>
        </Row>
    </Form>
</Card>
