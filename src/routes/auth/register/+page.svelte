
<!-- Script -->

<script lang="ts">
    
    import Card from '$components/Card.svelte';
    import Form from '$components/forms/Form.svelte';
	import Row from '$components/forms/Row.svelte';
	import Textfield from '$components/forms/TextInput.svelte';

</script>

<!-- Markup -->

<Card header="Register">
    <div slot="body">
        <Form>
            <Textfield label="First name" />
            <Textfield label="Last name" />
            <Textfield label="Username" />
            <Textfield label="Password" obfuscate={true} />
            <Textfield label="Confirm password" obfuscate={true} />
            <Row><button slot="right" class="btn-primary" type="submit">Register</button></Row>
        </Form>
    </div>
</Card>

<!-- Styles -->

<style lang="sass">
    
</style>
