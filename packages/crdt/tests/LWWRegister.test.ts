import { describe, test, expect, beforeEach, vi } from "vitest";
import { LWWRegister } from "../src/builtins/LWWRegister/index.ts";

describe('LWW-Register Tests', () => {
    test('Test Assign', () => {
        let register1 = new LWWRegister<string>("alice", "node1");

        expect(register1.getElement()).toBe("alice");
        expect(register1.getNodeId()).toEqual("node1");
        register1.assign("bob", "node2");
        expect(register1.getElement()).toBe("bob");
        expect(register1.getNodeId()).toEqual("node2");
    });

    test('Test Compare', () => {
        vi.useFakeTimers();
        const date = new Date(2000,1,1,13);
        vi.setSystemTime(date);

        let register1 = new LWWRegister<string>("alice", "node1");

        vi.useRealTimers();
        
        let register2 = new LWWRegister<string>("alice", "node2");

        expect(register1.compare(register2)).toEqual(true);
        expect(register2.compare(register1)).toEqual(false);
    });

    test('Test Merge', () => {
        let register1 = new LWWRegister<string>("alice", "node1");
        let register2 = new LWWRegister<string>("bob", "node2");

        register1.merge(register2);
        expect(register1.getElement()).toEqual("bob");
        expect(register2.getNodeId()).toEqual("node2");

        register2.merge(register1);
        expect(register1.getElement()).toEqual("bob");
        expect(register2.getNodeId()).toEqual("node2");
    });

    test('Test Merge w/same timestamp', () => {
        vi.useFakeTimers();
        const date = new Date(2000,1,1,13);
        vi.setSystemTime(date);

        let register1 = new LWWRegister<string>("alice", "node1");
        let register2 = new LWWRegister<string>("bob", "node2");

        expect(register1.getElement()).toBe("alice");
        expect(register1.getNodeId()).toEqual("node1");

        register1.merge(register2);
        expect(register1.getElement()).toBe("bob");
        expect(register1.getNodeId()).toEqual("node2");

        register2.merge(register1);
        expect(register1.getElement()).toBe("bob");
        expect(register1.getNodeId()).toEqual("node2");

        vi.useRealTimers();
    });
});