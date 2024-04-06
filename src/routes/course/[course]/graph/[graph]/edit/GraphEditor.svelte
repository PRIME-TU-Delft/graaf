
<!-- Scripts -->

<script lang="ts">

    import { graph } from '$scripts/graph/graph';
    import { Node } from '$scripts/graph/node';

    let nodes = [
		new Node(0, 0, 20,  'prosperous-red',   'Node 1', []),
		new Node(1, 30, 0,  'electric-green',   'Node 2', [0]),
		new Node(2, 30, 40, 'mysterious-blue',  'Node 3', [0, 1])
	];

</script>

<!-- Markup -->

<div class="editor">

    <svg class="graph" use:graph={nodes}/>

    <div class="controls">
    </div>

</div>

<!-- Styles -->

<style lang="sass">

    .editor
        width: 100%
        height: 600px

        .graph
            width: 100%
            height: 100%

</style>