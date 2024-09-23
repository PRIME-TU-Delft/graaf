
import prisma from '$lib/server/prisma'

import type { Domain as PrismaDomain } from '@prisma/client'
import type { SerializedDomain } from '$scripts/entities'

export { create, remove, setPosition, setX, setY, setName, setStyle, toggleRelation, makeDTO }


// ----------------> Helper functions <----------------


/**
 * Creates a Domain object in the database.
 * @param graphId id of the Graph object to which the Domain object belongs
 * @returns DTO of the created Domain object
 */

async function create(graphId: number): Promise<SerializedDomain> {
	const domain = await prisma.domain.create({
		data: {
			graph: {
				connect: {
					id: graphId
				}
			}
		}
	})

	return makeDTO(domain)
}

/**
 * Removes a Domain object from the database.
 * @param domainId id of the Domain object to remove
 * @returns void
 */

async function remove(domainId: number): Promise<void> {
	await prisma.domain.delete({
		where: {
			id: domainId
		}
	})
}

/**
 * Sets the position of a Domain object.
 * @param domainId id of the Domain object to update
 * @param x new x-coordinate of the Domain object
 * @param y new y-coordinate of the Domain object
 * @returns void
 * @throws 'Domain not found' if the Domain object is not found
 */

async function setPosition(domainId: number, x: number, y: number): Promise<void> {

	// Check if the Domain object exists
	const domain = await prisma.domain.findUnique({
		where: {
			id: domainId
		}
	})

	if (!domain) return Promise.reject('Domain not found')

	// Update
	await prisma.domain.update({
		where: {
			id: domainId
		},
		data: {
			x, y
		}
	})
}

/**
 * Sets the x-coordinate of a Domain object.
 * @param domainId id of the Domain object to update
 * @param x new x-coordinate of the Domain object
 * @returns void
 * @throws 'Domain not found' if the Domain object is not found
 */

async function setX(domainId: number, x: number): Promise<void> {

	// Check if the Domain object exists
	const domain = await prisma.domain.findUnique({
		where: {
			id: domainId
		}
	})

	if (!domain) return Promise.reject('Domain not found')

	// Update
	await prisma.domain.update({
		where: {
			id: domainId
		},
		data: {
			x
		}
	})
}

/**
 * Sets the y-coordinate of a Domain object.
 * @param domainId id of the Domain object to update
 * @param y new y-coordinate of the Domain object
 * @returns void
 * @throws 'Domain not found' if the Domain object is not found
 */

async function setY(domainId: number, y: number): Promise<void> {
	
	// Check if the Domain object exists
	const domain = await prisma.domain.findUnique({
		where: {
			id: domainId
		}
	})

	if (!domain) return Promise.reject('Domain not found')

	// Update
	await prisma.domain.update({
		where: {
			id: domainId
		},
		data: {
			y
		}
	})
}

/**
 * Updates the name of a Domain object.
 * @param domainId id of the Domain object to update
 * @param name new name of the Domain object
 * @returns void
 * @throws 'Domain not found' if the Domain object is not found
 */

async function setName(domainId: number, name?: string): Promise<void> {

	// Check if the Domain object exists
	const domain = await prisma.domain.findUnique({
		where: {
			id: domainId
		}
	})

	if (!domain) return Promise.reject('Domain not found')

	// Update
		await prisma.domain.update({
		where: {
			id: domainId
		},
		data: {
			name
		}
	})
}

/**
 * Updates the style of a Domain object.
 * @param domainId id of the Domain object to update
 * @param style new style of the Domain object
 * @returns void
 * @throws 'Domain not found' if the Domain object is not found
 */

async function setStyle(domainId: number, style?: string): Promise<void> {

	// Check if the Domain object exists
	const domain = await prisma.domain.findUnique({
		where: {
			id: domainId
		}
	})

	if (!domain) return Promise.reject('Domain not found')

	// Update
	await prisma.domain.update({
		where: {
			id: domainId
		},
		data: {
			style
		}
	})
}

/**
 * Toggles the relation between two Domain objects.
 * @param domainId id of the first Domain object
 * @param otherId id of the second Domain object
 * @returns void
 * @throws 'Domain not found' if either of the Domain objects is not found
 */

async function toggleRelation(domainId: number, otherId: number): Promise<void> {

	// Fetch the Domain objects
	const domain = await prisma.domain.findUnique({
		where: {
			id: domainId
		},
		include: {
			childDomains: true
		}
	})

	const other = await prisma.domain.findUnique({
		where: {
			id: otherId
		},
		include: {
			parentDomains: true
		}
	})

	if (!domain || !other) {
		return Promise.reject('Domain not found')
	}

	// Toggle the relation
	if (domain.childDomains.some(d => d.id === otherId)) {
		await prisma.domain.update({
			where: {
				id: domainId
			},
			data: {
				childDomains: {
					disconnect: {
						id: otherId
					}
				}
			}
		})

		await prisma.domain.update({
			where: {
				id: otherId
			},
			data: {
				parentDomains: {
					disconnect: {
						id: domainId
					}
				}
			}
		})
	} 
	
	else {
		await prisma.domain.update({
			where: {
				id: domainId
			},
			data: {
				childDomains: {
					connect: {
						id: otherId
					}
				}
			}
		})

		await prisma.domain.update({
			where: {
				id: otherId
			},
			data: {
				parentDomains: {
					connect: {
						id: domainId
					}
				}
			}
		})
	}
}

/**
 * Converts a Domain object to a SerializedDomain object, which can be sent to the client.
 * @param domain plain Domain object
 * @returns SerializedDomain object
 */

async function makeDTO(domain: PrismaDomain): Promise<SerializedDomain> {
	return {
		id: domain.id,
		x: domain.x,
		y: domain.y,
		name: domain.name || undefined,
		style: domain.style || undefined,
		children: await getChildIds(domain),
		parents: await getParentIds(domain)
	}
}

/**
 * Plain Domain objects dont have a children (many-to-many) field,
 * this method makes them available.
 * @param domain plain Domain object
 * @returns the ids of the children of the domain
 */

async function getChildIds(domain: PrismaDomain): Promise<number[]> {
	return (await prisma.domain.findMany({
		where: {
			parentDomains: {
				some: {
					id: domain.id
				}
			}
		},
		orderBy: {
			id: 'asc'
		}
	})).map(d => d.id)
}

/**
 * Plain Domain objects dont have a parents (many-to-many) field,
 * this method makes them available.
 * @param domain plain Domain object
 * @returns the ids of the parents of the domain
 */

async function getParentIds(domain: PrismaDomain): Promise<number[]> {
	return (await prisma.domain.findMany({
		where: {
			childDomains: {
				some: {
					id: domain.id
				}
			}
		},
		orderBy: {
			id: 'asc'
		}
	})).map(d => d.id)
}