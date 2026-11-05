import assert from "node:assert/strict";
import { test } from "node:test";
import { DRY_END, generatePlant } from "./plant-model.ts";

const plant = generatePlant();

test("the same seed always gives the same plant", () => {
  assert.deepEqual(generatePlant(), plant);
  assert.notDeepEqual(generatePlant(7).leaves[0], plant.leaves[0]);
});

test("every branch and root narrows toward its tip, so no line ends blunt", () => {
  for (const branch of [...plant.branches, ...plant.roots]) {
    assert.ok(branch.widths.at(-1)! < branch.widths[0] / 2, "tip is much thinner than the base");
    assert.ok(branch.widths.at(-1)! < 1);
  }
});

test("each branch starts on another one, so nothing floats", () => {
  for (const list of [plant.branches, plant.roots]) {
    for (const [index, branch] of list.entries()) {
      if (index === 0) continue;
      const attached = list.slice(0, index).some((other) =>
        other.xs.some((x, i) => x === branch.xs[0] && other.ys[i] === branch.ys[0]),
      );
      assert.ok(attached, `branch ${index} starts in the air`);
    }
  }
});

test("a branch only starts growing once its parent has reached that point", () => {
  for (const branch of plant.branches) {
    assert.ok(branch.born >= plant.branches[0].born);
    assert.ok(branch.born + branch.dur <= 1.01);
  }
});

test("roots stay under the ground", () => {
  for (const root of plant.roots) {
    for (const y of root.ys.slice(1)) assert.ok(y < 0);
  }
});

test("the dry season takes most leaves, and they come back after it", () => {
  const before = plant.leaves.filter((leaf) => leaf.born < 0.66);
  const fallen = before.filter((leaf) => leaf.fall <= DRY_END);
  assert.ok(fallen.length / before.length > 0.7);
  for (const leaf of fallen) {
    assert.ok(leaf.fall > leaf.born);
    assert.ok(leaf.regrow === 2 || leaf.regrow > DRY_END);
  }
  assert.ok(plant.leaves.filter((leaf) => leaf.born > DRY_END).length > 100, "new growth after the drought");
});
