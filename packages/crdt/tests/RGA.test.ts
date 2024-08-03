import { describe, test, expect, beforeEach } from "vitest";
import { RGA } from "../src/builtins/RGA"; // Adjust the import path according to your project structure

describe("Replicable Growable Array Tests", () => {
    let rga: RGA<string>;
    let peerRGA: RGA<string>;

    beforeEach(() => {
        rga = new RGA<string>("node1");
        peerRGA = new RGA<string>("node2");
    });

    test("Test Insert", () => {
        rga.insert(0, "A");
        rga.insert(1, "B");
        rga.insert(1, "C");
        rga.insert(0, "D");

        expect(rga.getElements()).toEqual(["D", "A", "C", "B"]);
    });

    test("Test Read", () => {
        rga.insert(0, "A");
        rga.insert(1, "B");
        rga.insert(1, "C");
        rga.delete(1);

        expect(rga.read(0)).toBe("A");
        expect(rga.read(1)).toBe("B");
    });

    test("Test Insert and Delete", () => {
        rga.insert(0, "A");
        rga.insert(1, "B");
        rga.insert(1, "C");
        rga.delete(0);
        rga.delete(0);
        expect(rga.getElements()).toEqual(["B"]);

        rga.clear();

        rga.insert(0, "A");
        rga.insert(1, "B");
        rga.delete(0);

        expect(rga.getElements()).toEqual(["B"]);

        rga.insert(0, "C");
        rga.insert(1, "D");
        expect(rga.getElements()).toEqual(["C", "D", "B"]);

        rga.delete(1);
        expect(rga.getElements()).toEqual(["C", "B"]);

        rga.delete(1);
        expect(rga.getElements()).toEqual(["C"]);

        peerRGA.insert(0, "E");
        peerRGA.insert(0, "F");
        peerRGA.insert(2, "G");
        peerRGA.insert(3, "H");
        peerRGA.delete(1);
        peerRGA.delete(1);
        peerRGA.delete(1);
        expect(peerRGA.getElements()).toEqual(["F"]);
    });

    test("Test Update", () => {
        rga.insert(0, "A");
        rga.insert(1, "B");
        rga.update(0, "C");
        rga.update(1, "D");

        expect(rga.getElements()).toEqual(["C", "D"]);
    });

    test("Test Merge Order", () => {
        rga.insert(0, "A");
        rga.insert(1, "B");

        peerRGA.insert(0, "C");
        peerRGA.insert(1, "D");

        rga.merge(peerRGA);

        expect(rga.getElements()).toEqual(["A", "C", "B", "D"]);
    });

    test("Test Merge with Delete", () => {
        rga.insert(0, 'A1');
        peerRGA.insert(0, 'B1');

        // Sync both replicas, both should be ["A1", "B1"]
        rga.merge(peerRGA);
        peerRGA.merge(rga);
        
        
        // console.log(rga.elements());
        // console.log(peerRGA.elements());
        rga.insert(1, 'A2');
        peerRGA.delete(1);
        // console.log(rga.elements());
        // console.log(peerRGA.elements());

        expect(rga.getElements()).toEqual(['A1', 'A2', 'B1']);
        expect(peerRGA.getElements()).toEqual(['A1']);

        rga.merge(peerRGA);
        peerRGA.merge(rga);

        expect(rga.getElements()).toEqual(peerRGA.getElements());
    });

});
