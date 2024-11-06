import { TopologyNode } from "@topology-foundation/node";
import type { TopologyObject } from "@topology-foundation/object";
import { Canvas } from "./objects/canvas";

const node = new TopologyNode();
let topologyObject: TopologyObject;
let canvasCRO: Canvas;
let peers: string[] = [];
let objectPeers: string[] = [];

const render = () => {
	const peers_element = <HTMLDivElement>document.getElementById("peers");
	peers_element.innerHTML = `[${peers.join(", ")}]`;

	const object_element = <HTMLDivElement>(
		document.getElementById("object_peers")
	);
	object_element.innerHTML = `[${objectPeers.join(", ")}]`;
	(<HTMLSpanElement>document.getElementById("canvasId")).innerText =
		topologyObject?.id;

	if (!canvasCRO) return;
	const canvas = canvasCRO.canvas;
	for (let x = 0; x < canvas.length; x++) {
		for (let y = 0; y < canvas[x].length; y++) {
			const pixel = document.getElementById(`${x}-${y}`);
			if (!pixel) continue;
			pixel.style.backgroundColor = `rgb(${canvas[x][y].color()[0]}, ${canvas[x][y].color()[1]}, ${canvas[x][y].color()[2]})`;
		}
	}
};

const random_int = (max: number) => Math.floor(Math.random() * max);

function paint_pixel(pixel: HTMLDivElement) {
	const [x, y] = pixel.id.split("-").map((v) => Number.parseInt(v, 10));
	const painting: [number, number, number] = [
		random_int(256),
		random_int(256),
		random_int(256),
	];
	canvasCRO.paint([x, y], painting);
	const [r, g, b] = canvasCRO.pixel(x, y).color();
	pixel.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
}

async function createConnectHandlers() {
	node.addCustomGroupMessageHandler(topologyObject.id, (e) => {
		if (topologyObject)
			objectPeers = node.networkNode.getGroupPeers(topologyObject.id);
		render();
	});

	node.objectStore.subscribe(topologyObject.id, (_, _obj) => {
		render();
	});
}

async function init() {
	await node.start();
	render();

	const canvas_element = <HTMLDivElement>document.getElementById("canvas");
	canvas_element.innerHTML = "";
	canvas_element.style.display = "inline-grid";

	canvas_element.style.gridTemplateColumns = Array(5).fill("1fr").join(" ");
	for (let x = 0; x < 5; x++) {
		for (let y = 0; y < 10; y++) {
			const pixel = document.createElement("div");
			pixel.id = `${x}-${y}`;
			pixel.style.width = "25px";
			pixel.style.height = "25px";
			pixel.style.backgroundColor = "rgb(0, 0, 0)";
			pixel.style.cursor = "pointer";
			pixel.addEventListener("click", () => paint_pixel(pixel));
			canvas_element.appendChild(pixel);
		}
	}

	node.networkNode.getNode().addEventListener("peer:connect", (peerId) => {
		peers = node.networkNode.getAllPeers();
		render();
	});

	node.networkNode.getNode().addEventListener("peer:disconnect", (peerId) => {
		peers = node.networkNode.getAllPeers();
		render();
	});

	const create_button = <HTMLButtonElement>document.getElementById("create");
	create_button.addEventListener("click", async () => {
		topologyObject = await node.createObject(new Canvas(5, 10));
		canvasCRO = topologyObject.cro as Canvas;

		createConnectHandlers();
		render();
	});

	const connect_button = <HTMLButtonElement>document.getElementById("connect");
	connect_button.addEventListener("click", async () => {
		const croId = (<HTMLInputElement>document.getElementById("canvasIdInput"))
			.value;
		try {
			topologyObject = await node.createObject(
				new Canvas(5, 10),
				croId,
				undefined,
				true,
			);
			canvasCRO = topologyObject.cro as Canvas;

			createConnectHandlers();
			render();
		} catch (e) {
			console.error("Error while connecting with CRO", croId, e);
		}
	});
}

init();
