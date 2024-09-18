import { TopologyNode } from "@topology-foundation/node";
import type { TopologyObject } from "@topology-foundation/object";
import { Grid } from "./objects/grid";

const node = new TopologyNode();
let topologyObject: TopologyObject;
let gridCRO: Grid;
let peers: string[] = [];
let discoveryPeers: string[] = [];
let objectPeers: string[] = [];
// const userId = Math.random().toString(36).substring(2);

const formatNodeId = (id: string): string => {
    return `${id.slice(0, 4)}...${id.slice(-4)}`;
};

const colorMap: Map<string, string> = new Map();

const hashCode = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2; // Initialize h with a default value

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s, l];
};

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h / 360 + 1 / 3);
        g = hue2rgb(p, q, h / 360);
        b = hue2rgb(p, q, h / 360 - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

const rgbToHex = (r: number, g: number, b: number): string => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

const getColorForNodeId = (id: string): string => {
    if (!colorMap.has(id)) {
        const hash = hashCode(id);
        let r = (hash & 0xFF0000) >> 16;
        let g = (hash & 0x00FF00) >> 8;
        let b = (hash & 0x0000FF);

        // Convert to HSL and adjust lightness to be below 50%
        let [h, s, l] = rgbToHsl(r, g, b);
        l = l * 0.5; // Set lightness to below 50%

        // Convert back to RGB
        [r, g, b] = hslToRgb(h, s, l);
        const color = rgbToHex(r, g, b); // Convert RGB to hex
        colorMap.set(id, color);
    }
    return colorMap.get(id)!;
};

const render = () => {
	if (topologyObject) {
		const gridIdElement = <HTMLSpanElement>document.getElementById("gridId");
		gridIdElement.innerText = topologyObject.id;
		document.getElementById("copyGridId")!.style.display = "inline"; // Show the button
	} else {
		document.getElementById("copyGridId")!.style.display = "none"; // Hide the button
	}

	const element_peerId = <HTMLDivElement>document.getElementById("peerId");
	element_peerId.innerHTML = `<strong style="color: ${getColorForNodeId(node.networkNode.peerId)};">${formatNodeId(node.networkNode.peerId)}</strong>`;

	const element_peers = <HTMLDivElement>document.getElementById("peers");
	element_peers.innerHTML = `[${peers.map(peer => `<strong style="color: ${getColorForNodeId(peer)};">${formatNodeId(peer)}</strong>`).join(", ")}]`;

	const element_discoveryPeers = <HTMLDivElement>(
		document.getElementById("discoveryPeers")
	);
	element_discoveryPeers.innerHTML = `[${discoveryPeers.map(peer => `<strong style="color: ${getColorForNodeId(peer)};">${formatNodeId(peer)}</strong>`).join(", ")}]`;

	const element_objectPeers = <HTMLDivElement>(
		document.getElementById("objectPeers")
	);
	element_objectPeers.innerHTML = `[${objectPeers.map(peer => `<strong style="color: ${getColorForNodeId(peer)};">${formatNodeId(peer)}</strong>`).join(", ")}]`;

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
			div.style.left = `${centerX + position.x * 50 + 5}px`; // Center the circle
			div.style.top = `${centerY - position.y * 50 + 5}px`; // Center the circle
            if (id === node.networkNode.peerId) {
    			div.style.width = `${34}px`;
	    		div.style.height = `${34}px`;
            } else {
                div.style.width = `${34+6}px`;
	    		div.style.height = `${34+6}px`;
            }
			div.style.backgroundColor = color;
			div.style.borderRadius = "50%";
			div.style.transition = "background-color 1s ease-in-out";
			div.style.animation = `glow-${id} 0.5s infinite alternate`;

			// Add black border for the current user's circle
			if (id === node.networkNode.peerId) {
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

    gridCRO.addUser(node.networkNode.peerId, getColorForNodeId(node.networkNode.peerId));
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

	gridCRO.moveUser(node.networkNode.peerId, direction);
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

	const copyButton = <HTMLButtonElement>document.getElementById("copyGridId");
	copyButton.addEventListener("click", () => {
		const gridIdText = (<HTMLSpanElement>document.getElementById("gridId")).innerText;
		navigator.clipboard.writeText(gridIdText).then(() => {
			alert("Grid CRO ID copied to clipboard!");
		}).catch(err => {
			console.error("Failed to copy: ", err);
		});
	});
}

main();
