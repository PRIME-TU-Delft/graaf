
<!-- Script -->

<script lang="ts">
    
    import Card from '$components/Card.svelte';
    import Form from '$components/Form.svelte';
	import Row from '$components/Row.svelte';
	import Textfield from '$components/Textfield.svelte';
    import ButtonSubmit from '$components/ButtonSubmit.svelte';

</script>

<!-- Markup -->

<Card header="Register">
    <Form>
        <Textfield label="First name" />
        <Textfield label="Last name" />
        <Textfield label="Username" />
        <Textfield label="Password" obfuscate={true} />
        <Textfield label="Confirm password" obfuscate={true} />
        <Row><ButtonSubmit slot="right" label="Register" /></Row>
    </Form>
</Card>

<!-- Styles -->

<style lang="sass">
    
</style>
