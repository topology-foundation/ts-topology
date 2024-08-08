import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { LSeq } from "../src/builtins/LSeq";

describe("LSeq Tests", () => {

    test("Test Insert", () => {
        let lseq = new LSeq("node1");

        lseq.insert(0,'hi');
        lseq.insert(1,'*');
        lseq.insert(2,'!');
    
        expect(lseq.query().join('')).toBe("hi*!");

        lseq.insert(2,'mom');
        lseq.insert(2,'zom');
        lseq.insert(2,'dad');
       
        expect(lseq.query().join('')).toBe("hi*dadzommom!");
    });

    test("Test Remove", () => {
        let lseq = new LSeq("node1");
        
        lseq.insert(0,'hi');
        lseq.insert(1,'*');
        lseq.insert(2,'mom');
        lseq.insert(3,'!');
    
        expect(lseq.query().join('')).toBe("hi*mom!");

        lseq.delete(2);

        expect(lseq.query().join('')).toBe("hi*!");

        lseq.insert(2,'mom');
        lseq.insert(2,'dad');

        expect(lseq.query().join('')).toBe("hi*dadmom!");

        lseq.delete(2);
        lseq.delete(2);

        expect(lseq.query().join('')).toBe("hi*!");
    });

    test("Test Merge", () => {
        let lseq1 = new LSeq("node1");
        let lseq2 = new LSeq("node2");

        lseq1.insert(0, 'hi');
        lseq1.insert(1, '*');
        lseq1.insert(2, '!');

        expect(lseq1.query().join('')).toBe("hi*!");

        lseq2.merge(lseq1);

        expect(lseq2.query().join('')).toBe("hi*!");

        lseq1.insert(2, 'm');
        lseq1.insert(2, 'o');
        lseq1.insert(2, 'm');
        lseq2.insert(2 ,'d');
        lseq2.insert(2 ,'a');
        lseq2.insert(2 ,'d');

        expect(lseq1.query().join('')).toBe("hi*mom!");
        expect(lseq2.query().join('')).toBe("hi*dad!");

        lseq1.merge(lseq2);
        lseq2.merge(lseq1);

        expect(lseq1.query().join('')).toBe("hi*dadmom!");
        expect(lseq2.query().join('')).toBe("hi*dadmom!");
        
    });
});