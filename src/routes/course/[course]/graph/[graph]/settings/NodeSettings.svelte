
<script lang="ts">

    import TextField from "$components/TextField.svelte";
    import Dropdown from "$components/Dropdown.svelte";
    import Searchbar from "$components/Searchbar.svelte";
    import Button from "$components/Button.svelte";
    import IconButton from "$components/IconButton.svelte";

    import trashIcon from "$assets/trash-icon.svg";

    import { styles } from "$scripts/graph/settings"

    class Node {
        id: number;
        name: string;
        color: string;

        constructor() {
            this.id = 0;
            nodes.forEach(node => {
                if (node.id >= this.id) {
                    this.id = node.id + 1;
                }
            });
        }
    }

    function addNode() {
        nodes = [...nodes, new Node()];
    }

    let nodes = [];
    let colors = [];

    for (let color in styles) {
        colors.push({ name: color, value: styles[color].stroke });
    }


</script>

<div class="node-list">

    <div class="toolbar">
        <Button on:click={addNode}> Add Node </Button>
        <div class="flex-spacer" />
        <Searchbar />
    </div>

    <div class=node>
        <span class="name"> Name </span>
        <span class="color"> Color </span>
    </div>

    {#each nodes as node}
        <div class="node">
            <span class="id"> {node.id} </span>
            <IconButton scale src={trashIcon} />
            <TextField label="Name" placeholder="Domain Name" />
            <Dropdown label="Color" placeholder="Domain Color" options={colors}/>

            <span class="preview" style:background-color={colors[node.color]} />
        </div>
    {/each}

</div>

<style lang="sass">

    @use '$styles/variables.sass' as *
    @use '$styles/palette.sass' as *

    $icon-width: calc($input-icon-size + 2 * $input-icon-padding)

    .node-list
        display: flex
        flex-flow: column nowrap
        padding: $card-thick-padding
        
        .toolbar
            display: flex
            flex-flow: row nowrap

        .node
            display: grid
            grid-template: "id delete name color preview" auto / $icon-width $icon-width 1fr 1fr $icon-width
            place-items: center center
            width: 100%

            .id
                grid-area: id
            :global(.icon-button)
                grid-area: delete
            .name, :global(.text-field)
                grid-area: name
            .color, :global(.dropdown)
                grid-area: color
            .preview
                grid-area: preview

                width: $input-icon-size
                height: $input-icon-size
                padding: $input-icon-padding
            
    
</style>