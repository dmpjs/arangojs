import { Rhum } from "./../test_deps.ts";
import { Database } from "../mod/database.ts";
import { Connection } from "../src/connection.ts";

Rhum.testPlan("ArangoJS Deno Basics", () => {
  Rhum.testSuite("Database", () => {
    const db = new Database({ arangoVersion: 54321 });

    Rhum.testCase("using the constructor", () => {
      Rhum.asserts.assertEquals(true, db instanceof Database);
    });

    Rhum.testCase("passes any configs to the connection", () => {
      // @ts-ignore
      Rhum.asserts.assertEquals(54321, db.connection._arangoVersion);
    });
  });

  Rhum.testSuite("Configuring the driver", () => {
    Rhum.testCase("with a url", () => {
      const url = "https://example.com:9000";
      const conn = new Connection({ url });

      // @ts-ignore
      Rhum.asserts.assertEquals([url], conn._urls);
    });

    Rhum.testCase("with headers", () => {
      const headers = {
        "x-one": "1",
        "x-two": "2",
      };
      const conn = new Connection({ headers });

      // @ts-ignore
      Rhum.asserts.assertEquals(headers, conn._headers);
    });
  });
});
