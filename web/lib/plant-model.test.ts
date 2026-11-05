import assert from "node:assert/strict";
import { test } from "node:test";
import { DRY_END, generatePlant, reachedAt, SPROUT_FADE } from "./plant-model.ts";

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

test("the crown has masses of shade, and the shaded leaves are drawn first", () => {
  assert.ok(plant.foliage.length >= 30);
  for (const mass of plant.foliage) assert.ok(mass.y > 25, "shade stays up in the crown");
  const hues = plant.leaves.map((leaf) => leaf.hue);
  assert.deepEqual(hues, [...hues].sort((a, b) => b - a));
});

test("a branch starts only after its parent's tip has passed that point", () => {
  for (const [index, branch] of plant.branches.entries()) {
    if (index === 0) continue;
    const starts = plant.branches.slice(0, index).flatMap((parent) =>
      parent.xs
        .map((x, i) => (x === branch.xs[0] && parent.ys[i] === branch.ys[0] ? reachedAt(parent, i) : null))
        .filter((time) => time !== null),
    );
    assert.ok(branch.born >= Math.min(...starts), `branch ${index} grows ahead of its parent`);
  }
});

test("every leaf and shade mass appears where a branch has already grown", () => {
  const grownBy = (x: number, y: number, time: number, reach: number) =>
    plant.branches.some((branch) =>
      branch.xs.some((bx, i) => Math.hypot(bx - x, branch.ys[i] - y) <= reach && reachedAt(branch, i) <= time),
    );
  for (const leaf of plant.leaves) assert.ok(grownBy(leaf.x, leaf.y, leaf.born, 14), "leaf in the air");
  for (const mass of plant.foliage) assert.ok(grownBy(mass.x, mass.y, mass.born, 0.01), "shade in the air");
});

test("the sprout's leaves stay on the branches stage and are gone before the dry season", () => {
  const sprouts = plant.leaves.filter((leaf) => leaf.sprout);
  assert.equal(sprouts.length, 6);
  for (const leaf of sprouts) {
    assert.ok(leaf.born < 0.6 && leaf.fall > 0.62, "visible on Galhos, at 0.6");
    assert.ok(leaf.fall + SPROUT_FADE < 0.8, "faded before Seca, at 0.8");
    assert.equal(leaf.regrow, 2);
  }
});
