import { TopologyNode } from "@topology-foundation/node";
import type { TopologyObject } from "@topology-foundation/object";
import { Grid } from "./objects/grid";

const node = new TopologyNode();
let topologyObject: TopologyObject;
let gridCRO: Grid;
let peers: string[] = [];
let discoveryPeers: string[] = [];
let objectPeers: string[] = [];
const userId = Math.random().toString(36).substring(2);
const userColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

const render = () => {
	if (topologyObject)
		(<HTMLButtonElement>document.getElementById("gridId")).innerText =
			topologyObject.id;
	const element_peerId = <HTMLDivElement>document.getElementById("peerId");
	element_peerId.innerHTML = node.networkNode.peerId;

	const element_peers = <HTMLDivElement>document.getElementById("peers");
	element_peers.innerHTML = `[${peers.join(", ")}]`;

	const element_discoveryPeers = <HTMLDivElement>(
		document.getElementById("discoveryPeers")
	);
	element_discoveryPeers.innerHTML = `[${discoveryPeers.join(", ")}]`;

	const element_objectPeers = <HTMLDivElement>(
		document.getElementById("objectPeers")
	);
	element_objectPeers.innerHTML = `[${objectPeers.join(", ")}]`;

	if (!gridCRO) return;
	const users = gridCRO.getUsers();
	const element_grid = <HTMLDivElement>document.getElementById("grid");
	element_grid.innerHTML = "";

	const gridWidth = element_grid.clientWidth;
	const gridHeight = element_grid.clientHeight;
	const centerX = Math.floor(gridWidth / 2);
	const centerY = Math.floor(gridHeight / 2);

	// Draw grid lines
	const numLinesX = Math.floor(gridWidth / 50);
	const numLinesY = Math.floor(gridHeight / 50);

	for (let i = -numLinesX; i <= numLinesX; i++) {
		const line = document.createElement("div");
		line.style.position = "absolute";
		line.style.left = `${centerX + i * 50}px`;
		line.style.top = "0";
		line.style.width = "1px";
		line.style.height = "100%";
		line.style.backgroundColor = "lightgray";
		element_grid.appendChild(line);
	}

	for (let i = -numLinesY; i <= numLinesY; i++) {
		const line = document.createElement("div");
		line.style.position = "absolute";
		line.style.left = "0";
		line.style.top = `${centerY + i * 50}px`;
		line.style.width = "100%";
		line.style.height = "1px";
		line.style.backgroundColor = "lightgray";
		element_grid.appendChild(line);
	}

	for (const userColorString of users) {
		const [id, color] = userColorString.split(':');
		const position = gridCRO.getUserPosition(userColorString);

		if (position) {
			const div = document.createElement("div");
			div.style.position = "absolute";
			div.style.left = `${centerX + position.x * 50 + 2}px`; // Center the circle
			div.style.top = `${centerY - position.y * 50 + 2}px`; // Center the circle
			div.style.width = "40px";
			div.style.height = "40px";
			div.style.backgroundColor = color;
			div.style.borderRadius = "50%";
			div.style.transition = "background-color 1s ease-in-out";
			div.style.animation = `glow-${id} 0.5s infinite alternate`;

			// Add black border for the current user's circle
			if (id === userId) {
				div.style.border = "3px solid black";
			}

			// Create dynamic keyframes for the glow effect
			const style = document.createElement("style");
			style.innerHTML = `
			@keyframes glow-${id} {
                0% {
                    background-color: ${hexToRgba(color, 0.5)};
                }
                100% {
                    background-color: ${hexToRgba(color, 1)};
                }
            }`;
			document.head.appendChild(style);

			element_grid.appendChild(div);
		}
	}
};

// Helper function to convert hex color to rgba
function hexToRgba(hex: string, alpha: number) {
	const bigint = parseInt(hex.slice(1), 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

async function addUser() {
    if (!gridCRO) {
        console.error("Grid CRO not initialized");
        alert("Please create or join a grid first");
        return;
    }

    gridCRO.addUser(userId, userColor);
    render();

    // testing
    const users = gridCRO.getUsers();
    console.log('users', users);
    for (const userColorString of users) {
        const position = gridCRO.getUserPosition(userColorString);
        console.log('userColorString', userColorString, 'position', JSON.stringify(position, null, 2));
    }
    console.log('----------------------------------');
}

async function moveUser(direction: string) {
	if (!gridCRO) {
		console.error("Grid CRO not initialized");
		alert("Please create or join a grid first");
		return;
	}

	gridCRO.moveUser(userId, direction);
	render();

    // testing
    const users = gridCRO.getUsers();
    console.log('users', users);
    for (const userColorString of users) {
		const position = gridCRO.getUserPosition(userColorString);
        console.log('userColorString', userColorString, 'position', JSON.stringify(position, null, 2));
    }
    console.log('----------------------------------');
}

async function createConnectHandlers() {
	node.addCustomGroupMessageHandler(topologyObject.id, (e) => {
		if (topologyObject)
			objectPeers = node.networkNode.getGroupPeers(topologyObject.id);
		render();
	});

	node.objectStore.subscribe(topologyObject.id, (_, obj) => {
		render();
	});
}

async function main() {
	await node.start();
	render();

	node.addCustomGroupMessageHandler("", (e) => {
		peers = node.networkNode.getAllPeers();
		discoveryPeers = node.networkNode.getGroupPeers("topology::discovery");
		render();
	});

	const button_create = <HTMLButtonElement>(
		document.getElementById("createGrid")
	);
	button_create.addEventListener("click", async () => {
		topologyObject = await node.createObject(new Grid());
		gridCRO = topologyObject.cro as Grid;
		createConnectHandlers();
        await addUser();
		render();
	});

	const button_connect = <HTMLButtonElement>document.getElementById("joinGrid");
	button_connect.addEventListener("click", async () => {
        const croId = (<HTMLInputElement>document.getElementById("gridInput"))
			.value;
        try {
            topologyObject = await node.createObject(
                new Grid(),
                croId,
                undefined,
                true,
            );
            gridCRO = topologyObject.cro as Grid;
            createConnectHandlers();
            await addUser();
            render();
            console.log("Succeeded in connecting with CRO", croId);
        } catch (e) {
            console.error("Error while connecting with CRO", croId, e);
        }
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "w") moveUser("U");
		if (event.key === "a") moveUser("L");
		if (event.key === "s") moveUser("D");
		if (event.key === "d") moveUser("R");
	});
}

main();
