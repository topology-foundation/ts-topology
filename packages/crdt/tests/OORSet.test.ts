import { describe, test, expect, beforeEach } from "vitest";
import { OORSet, ElementTuple } from "../src/builtins/OORSet";

describe("OR-Set Tests", () => {

  let set1: ORSet<string>;
  let set2: ORSet<string>;

  const testValues = ["walter", "jesse", "mike"];

  beforeEach(() => {
    set1 = new ORSet<string>(new Set<ElementTuple<string>>(), "set1");
    set2 = new ORSet<string>(new Set<ElementTuple<string>>(), "set2");

    testValues.forEach((value) => {
      set1.add(value);
      set2.add(value);
    });
  });

  test("Test Add Elements", () => {
    expect(set1.lookup("gustavo")).toBe(false);

    set1.add("gustavo");

    expect(set1.lookup("gustavo")).toBe(true);
  });

  test("Test Remove Elements", () => {
    expect(set1.lookup("mike")).toBe(true);

    set1.remove("mike");

    expect(set1.lookup("mike")).toBe(false);
  });

  test("Test Compare & Merge Elements", () => {
    expect(set1.compare(set2)).toBe(false);

    set1.merge(set2);
    set2.merge(set1);

    expect(set1.compare(set2)).toBe(true);
  });

});
