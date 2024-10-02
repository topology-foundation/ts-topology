"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGrid = exports.Grid = void 0;
const object_1 = require("@topology-foundation/object");
class Grid {
    operations = ["addUser", "moveUser"];
    semanticsType = object_1.SemanticsType.pair;
    positions;
    constructor() {
        this.positions = new Map();
    }
    addUser(userId, color) {
        this._addUser(userId, color);
    }
    _addUser(userId, color) {
        const userColorString = `${userId}:${color}`;
        this.positions.set(userColorString, { x: 0, y: 0 });
    }
    moveUser(userId, direction) {
        this._moveUser(userId, direction);
    }
    _moveUser(userId, direction) {
        const userColorString = [...this.positions.keys()].find((u) => u.startsWith(`${userId}:`));
        if (userColorString) {
            const position = this.positions.get(userColorString);
            if (position) {
                switch (direction) {
                    case "U":
                        position.y += 1;
                        break;
                    case "D":
                        position.y -= 1;
                        break;
                    case "L":
                        position.x -= 1;
                        break;
                    case "R":
                        position.x += 1;
                        break;
                }
            }
        }
    }
    getUsers() {
        return [...this.positions.keys()];
    }
    getUserPosition(userColorString) {
        const position = this.positions.get(userColorString);
        if (position) {
            return position;
        }
        return undefined;
    }
    resolveConflicts(vertices) {
        return { action: object_1.ActionType.Nop };
    }
    mergeCallback(operations) {
        // reset this.positions
        this.positions = new Map();
        // apply operations to this.positions
        for (const op of operations) {
            if (!op.value)
                continue;
            switch (op.type) {
                case "addUser": {
                    const [userId, color] = op.value;
                    this._addUser(userId, color);
                    break;
                }
                case "moveUser": {
                    const [userId, direction] = op.value;
                    this._moveUser(userId, direction);
                    break;
                }
            }
        }
    }
}
exports.Grid = Grid;
function createGrid() {
    return new Grid();
}
exports.createGrid = createGrid;
