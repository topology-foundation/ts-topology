import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { LSeq } from "../src/builtins/LSeq";

describe("LSeq Tests", () => {

    test("Test Insert", () => {
        let lseq = new LSeq();
        lseq.insert("node1", 0, 'a');
        lseq.insert("node1", 1, 'b');
        lseq.insert("node1", 2, 'c');
        expect(lseq.query()).toBe("abc");
    });

   
});