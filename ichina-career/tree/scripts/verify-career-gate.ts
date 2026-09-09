import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CAREER_OWNER_EMAIL, isCareerOwner } from "../lib/career/gate.ts";

function testOwner() {
  assert.equal(CAREER_OWNER_EMAIL, "yying2010@gmail.com");
  assert.equal(isCareerOwner("yying2010@gmail.com"), true);
  assert.equal(isCareerOwner(" YYING2010@Gmail.com "), true);
  assert.equal(isCareerOwner("yok@dseek.ai"), false);
  assert.equal(isCareerOwner(""), false);
  assert.equal(isCareerOwner(null), false);
}

function testBuiltPage() {
  const out = join(process.cwd(), "out");
  const candidates = [join(out, "career.html"), join(out, "career/index.html")];
  const page = candidates.find((file) => existsSync(file));
  assert.ok(page, "static export must include /career");
  const html = readFileSync(page, "utf8");
  assert.doesNotMatch(html, /r-4680797737198275177/);
  assert.doesNotMatch(html, /Yunrui|Ruitian/i);
  assert.match(html, /Sign in with Jubit|Private desk|Checking the door|Private/i);
}

function main() {
  testOwner();
  if (existsSync(join(process.cwd(), "out"))) testBuiltPage();
  console.log("verify-career-gate: ok");
}

main();
