import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { FUNDING_OWNER_EMAIL, isFundingOwner } from "../lib/funding/gate.ts";
import { fundingDesk } from "../lib/funding/desk.ts";

const treeRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function testOwner() {
  assert.equal(FUNDING_OWNER_EMAIL, "yying2010@gmail.com");
  assert.equal(isFundingOwner("yying2010@gmail.com"), true);
  assert.equal(isFundingOwner(" YYING2010@Gmail.com "), true);
  assert.equal(isFundingOwner("yok@dseek.ai"), false);
  assert.equal(isFundingOwner(""), false);
  assert.equal(isFundingOwner(null), false);
}

function testDeskHome() {
  assert.equal(fundingDesk.id, "ichina-funding");
  assert.equal(fundingDesk.home, "https://ichina.co/funding");
  assert.equal(fundingDesk.product, "https://ichina.co");
  assert.doesNotMatch(fundingDesk.product, /poker|planet/i);
  const field = readFileSync(join(treeRoot, "lib/funding/programs.ts"), "utf8");
  assert.match(field, /ichina\.co/);
  assert.match(field, /Not a poker raise/);
  assert.match(field, /Not a planet-only raise/);
  assert.match(field, /id: "F1"/);
  assert.match(field, /id: "F2"/);
  assert.match(field, /id: "F3"/);
  assert.doesNotMatch(readFileSync(join(treeRoot, "lib/funding/desk.ts"), "utf8"), /Yunrui|Ruitian/i);
}

function testFieldSplit() {
  const hunt = readFileSync(join(treeRoot, "lib/funding/hunt.ts"), "utf8");
  assert.match(hunt, /ichina-funding-hunt/);
  assert.match(hunt, /ichina-funding-watch/);
  assert.match(hunt, /ichina-funding-pane/);
  assert.doesNotMatch(hunt, /ichina-career-hunt/);
}

function testBuiltPage() {
  const out = join(process.cwd(), "out");
  const candidates = [join(out, "funding.html"), join(out, "funding/index.html")];
  const page = candidates.find((file) => existsSync(file));
  assert.ok(page, "static export must include /funding");
  const html = readFileSync(page, "utf8");
  assert.doesNotMatch(html, /Yunrui|Ruitian/i);
  assert.match(html, /Continue with Google|Private desk|Checking the door|Private/i);
  assert.doesNotMatch(html, /China top-15|offshore hedge/i);
}

function main() {
  testOwner();
  testDeskHome();
  testFieldSplit();
  if (existsSync(join(process.cwd(), "out"))) testBuiltPage();
  console.log("verify-funding-gate: ok");
}

main();
