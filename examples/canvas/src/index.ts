import { GCounter } from "@topology-foundation/crdt";
import { TopologyNode } from "@topology-foundation/node";
import type { TopologyObject } from "@topology-foundation/object";
import { handleObjectOps } from "./handlers";
import { Canvas } from "./objects/canvas";
import { Pixel } from "./objects/pixel";

const node = new TopologyNode();
let topologyObject: TopologyObject<Canvas>;
let canvasCRO: Canvas;
let peers: string[] = [];
let discoveryPeers: string[] = [];
let objectPeers: string[] = [];

const render = () => {
	const peers_element = <HTMLDivElement>document.getElementById("peers");
	peers_element.innerHTML = `[${peers.join(", ")}]`;

	const discovery_element = <HTMLDivElement>(
		document.getElementById("discovery_peers")
	);
	discovery_element.innerHTML = `[${discoveryPeers.join(", ")}]`;

	const object_element = <HTMLDivElement>(
		document.getElementById("object_peers")
	);
	object_element.innerHTML = `[${objectPeers.join(", ")}]`;

	if (!canvasCRO) return;
	const canvas = canvasCRO.canvas;
	const canvas_element = <HTMLDivElement>document.getElementById("canvas");
	canvas_element.innerHTML = "";
	canvas_element.style.display = "inline-grid";

	canvas_element.style.gridTemplateColumns = Array(canvas.length)
		.fill("1fr")
		.join(" ");

	for (let x = 0; x < canvas.length; x++) {
		for (let y = 0; y < canvas[x].length; y++) {
			const pixel = document.createElement("div");
			pixel.id = `${x}-${y}`;
			pixel.style.width = "25px";
			pixel.style.height = "25px";
			pixel.style.backgroundColor = `rgb(${canvas[x][y].color()[0]}, ${canvas[x][y].color()[1]}, ${canvas[x][y].color()[2]})`;
			pixel.style.cursor = "pointer";
			pixel.addEventListener("click", () => paint_pixel(pixel));
			canvas_element.appendChild(pixel);
		}
	}
};

const random_int = (max: number) => Math.floor(Math.random() * max);

async function paint_pixel(pixel: HTMLDivElement) {
	const [x, y] = pixel.id.split("-").map((v) => Number.parseInt(v, 10));
	const painting: [number, number, number] = [
		random_int(256),
		random_int(256),
		random_int(256),
	];
	canvasCRO.paint(node.networkNode.peerId, [x, y], painting);
	const [r, g, b] = canvasCRO.pixel(x, y).color();
	pixel.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
}

async function init() {
	await node.start();

	node.addCustomGroupMessageHandler("", (e) => {
		peers = node.networkNode.getAllPeers();
		discoveryPeers = node.networkNode.getGroupPeers("topology::discovery");
		render();
	});

	const create_button = <HTMLButtonElement>document.getElementById("create");
	create_button.addEventListener("click", async () => {
		topologyObject = await node.createObject(new Canvas(5, 10));
		canvasCRO = topologyObject.cro as Canvas;

		// message handler for the CRO
		node.addCustomGroupMessageHandler(topologyObject.id, (e) => {
			// on create/connect
			if (topologyObject)
				objectPeers = node.networkNode.getGroupPeers(topologyObject.id);
			render();
		});

		node.objectStore.subscribe(topologyObject.id, (_, obj) => {
			handleObjectOps(canvasCRO, obj.vertices);
		});

		(<HTMLSpanElement>document.getElementById("canvasId")).innerText =
			topologyObject.id;
		render();
	});

	const connect_button = <HTMLButtonElement>document.getElementById("connect");
	connect_button.addEventListener("click", async () => {
		const croId = (<HTMLInputElement>document.getElementById("canvasIdInput"))
			.value;
		try {
			topologyObject = await node.createObject(new Canvas(5, 10), croId);
			canvasCRO = topologyObject.cro as Canvas;

			// message handler for the CRO
			node.addCustomGroupMessageHandler(topologyObject.id, (e) => {
				// on create/connect
				if (topologyObject)
					objectPeers = node.networkNode.getGroupPeers(topologyObject.id);
				(<HTMLSpanElement>document.getElementById("canvasId")).innerText =
					topologyObject.id;
				render();
			});

			node.objectStore.subscribe(topologyObject.id, (_, obj) => {
				handleObjectOps(canvasCRO, obj.vertices);
				render();
			});

			render();
		} catch (e) {
			console.error("Error while connecting with CRO", croId, e);
		}
	});
}

init();
