import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CAREER_OWNER_EMAIL, isCareerOwner } from "../lib/career/gate.ts";

const treeRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

function testOwner() {
  assert.equal(CAREER_OWNER_EMAIL, "yying2010@gmail.com");
  assert.equal(isCareerOwner("yying2010@gmail.com"), true);
  assert.equal(isCareerOwner(" YYING2010@Gmail.com "), true);
  assert.equal(isCareerOwner("yok@dseek.ai"), false);
  assert.equal(isCareerOwner(""), false);
  assert.equal(isCareerOwner(null), false);
}

function testProfileSource() {
  const profile = readFileSync(join(treeRoot, "lib/career/profile.ts"), "utf8");
  assert.doesNotMatch(profile, /Yunrui|Ruitian/i);
  assert.match(profile, /IM \/ Director \/ OMO \/ RO/);
  assert.match(profile, /Founder & Executive Director/);
  assert.match(profile, /2025-09/);
  const hunt = readFileSync(join(treeRoot, "lib/career/hunt.ts"), "utf8");
  assert.match(hunt, /export type CareerPane/);
  assert.match(hunt, /applied/);
}

function testBuiltPage() {
  const out = join(process.cwd(), "out");
  const candidates = [join(out, "career.html"), join(out, "career/index.html")];
  const page = candidates.find((file) => existsSync(file));
  assert.ok(page, "static export must include /career");
  const html = readFileSync(page, "utf8");
  assert.doesNotMatch(html, /r-4680797737198275177/);
  assert.doesNotMatch(html, /Yunrui|Ruitian/i);
  assert.match(html, /Continue with Google|Private desk|Checking the door|Private/i);
  assert.doesNotMatch(html, /China top-15|offshore hedge/i);
}

function main() {
  testOwner();
  testProfileSource();
  if (existsSync(join(process.cwd(), "out"))) testBuiltPage();
  console.log("verify-career-gate: ok");
}

main();
