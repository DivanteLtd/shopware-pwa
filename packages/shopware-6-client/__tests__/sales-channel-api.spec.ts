import { invokeGet } from "@shopware-pwa/shopware-6-client";
import * as allEndpoints from "../src/endpoints";

describe("sales-channel-api", () => {
  const endpoints = Object.keys(allEndpoints);
  const ApiEndpointsMap = endpoints.map((functionName: string) =>
    // @ts-ignore
    allEndpoints[functionName]()
  );
  it("should contain all the methods implemented", async () => {
    const {
      data: {
        paths,
        info: { version },
      },
    } = await invokeGet({
      address: `/sales-channel-api/v2/_info/openapi3.json`,
    });
    const regex = /(\{[\w-A-Za-z]+})/g;

    const coveredEndpoints = Object.keys(paths)
      .filter((path) => path.includes("sales-channel-api"))
      .map((path) => {
        const endpointPath = path.replace(regex, "undefined");
        const endpoint = `/sales-channel-api/v${version}${endpointPath}`;
        return endpoint;
      });
    expect(ApiEndpointsMap).toEqual(expect.arrayContaining(coveredEndpoints));
  });
});
