import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";
import { z } from "zod";
import { serialize, deserialize } from "seroval";
const require = createRequire(import.meta.url);
const yaml = require("js-yaml") as { load: (value: string, options?: { maxTotalMergeKeys: number }) => unknown };
const sourceMap = require("source-map-js") as { SourceMapConsumer: new (map: unknown) => { originalPositionFor: (position: {line:number;column:number}) => {source:string;line:number;column:number} } };

describe("Scoped dependency security fixes", () => {
  it("rejects an oversized constrained Zod collection before visiting elements", () => {
    let visited = 0;
    const schema = z.array(z.custom(() => { visited++; return true; })).max(2);
    const result = schema.safeParse([1, 2, 3]);
    expect(result.success).toBe(false);
    expect(visited).toBe(0);
    expect(schema.parse([1, 2])).toEqual([1, 2]);
  });
  it("limits even empty YAML merge sources", () => {
    expect(() => yaml.load('a: &a {}\nb:\n  <<: [*a, *a, *a]', {maxTotalMergeKeys: 2})).toThrow(/maxTotalMergeKeys/);
    expect(yaml.load('a: &a {x: 1}\nb:\n  <<: *a')).toEqual({a:{x:1},b:{x:1}});
  });
  it("rejects excessive indexed source map offsets and preserves ordinary mappings", () => {
    const flat = {version:3,sources:['a.ts'],names:[],mappings:'AAAA'};
    expect(() => new sourceMap.SourceMapConsumer({version:3,sections:[{offset:{line:1000000000,column:0},map:flat}]})).toThrow(/offset line/);
    const consumer = new sourceMap.SourceMapConsumer(flat);
    expect(consumer.originalPositionFor({line:1,column:0})).toMatchObject({source:'a.ts',line:1,column:0});
  });
  it("does not serialize an attacker-supplied typed-array constructor as executable code", () => {
    const value = new Uint8Array([1,2]);
    Object.defineProperty(value,'constructor',{value:function INJECTED_CONSTRUCTOR(){return 'INJECTED_CONSTRUCTOR';}});
    let text: string | undefined;
    let error: unknown;
    try { text = serialize(value); } catch (e) { error = e; }
    if (error) expect(error).toBeInstanceOf(Error);
    else { expect(text).toBeDefined(); expect(text).not.toContain('INJECTED_CONSTRUCTOR'); }
    expect(deserialize(serialize(new Uint8Array([1,2])))).toEqual(new Uint8Array([1,2]));
  });
  it("keeps RegExp serialization safe for embedding in scripts", () => {
    const serialized=serialize(new RegExp('</script><script>INJECTED_MARKER</script>'));
    expect(serialized).not.toContain('</script>');
    expect(deserialize(serialize(/safe/i))).toEqual(/safe/i);
  });
});