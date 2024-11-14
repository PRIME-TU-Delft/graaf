<script lang="ts">

	// Components
	import SortableList from '$components/SortableList.svelte'

	let list = [
		{ id: 1, name: 'one' },
		{ id: 2, name: 'two' },
		{ id: 3, name: 'three' },
		{ id: 4, name: 'four' },
		{ id: 5, name: 'five' },
		{ id: 6, name: 'six' },
		{ id: 7, name: 'seven' },
		{ id: 8, name: 'eight' },
		{ id: 9, name: 'nine' },
		{ id: 10, name: 'ten' },
	]
</script>

<SortableList {list} let:item>
	{item.name}
</SortableList>