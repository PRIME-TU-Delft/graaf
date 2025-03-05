
<script lang="ts">

    import GraphRenderer from "$lib/components/GraphRenderer.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

</script>

<GraphRenderer data={ data.course.graphs[0] } editable={ true } />
