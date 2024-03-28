
<script lang="ts">
    import Form from '$components/Form.svelte';
</script>

<a href="/dashboard"> dashboard </a>

<Form let:Button let:Textfield let:Checkbox>
    <Textfield label="Username" />
    <Textfield label="Password" obfuscate />
    <Checkbox label="Remember me" />
    <Button submit> Submit </Button>
</Form>
