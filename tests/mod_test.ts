import { greeting } from "../mod.ts";
import { assertEquals, assertThrows } from "./../test_deps.ts";

const { test } = Deno;

test("pass", (): void => {
  assertEquals(greeting("deno"), `Hello deno`);
});

test("fail", (): void => {
  assertThrows(() => greeting());
});
