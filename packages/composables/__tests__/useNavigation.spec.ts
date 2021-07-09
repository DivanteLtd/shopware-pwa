import { ref } from "vue-demi";
import { useNavigation } from "../src/hooks/useNavigation";
import * as shopwareClient from "@shopware-pwa/shopware-6-client";
jest.mock("@shopware-pwa/shopware-6-client");
const mockedGetPage = shopwareClient as jest.Mocked<typeof shopwareClient>;
import * as Composables from "@shopware-pwa/composables";
jest.mock("@shopware-pwa/composables");
const mockedComposables = Composables as jest.Mocked<typeof Composables>;
const consoleErrorSpy = jest.spyOn(console, "error");

describe("Composables - useNavigation", () => {
  const getDefaultsMock = jest.fn().mockImplementation(() => {
    return {
      useNavigation: {},
    };
  });

  mockedComposables.useDefaults.mockImplementation(() => {
    return {
      getDefaults: getDefaultsMock,
      getIncludesConfig: jest.fn(),
      getAssociationsConfig: jest.fn(),
    } as any;
  });
  mockedComposables.getApplicationContext.mockImplementation(() => {
    return {
      apiInstance: jest.fn(),
    } as any;
  });

  mockedComposables.useSharedState.mockImplementation(() => {
    return {
      sharedRef: () => ref(),
    } as any;
  });

  const rootContextMock: any = {
    $shopwareApiInstance: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy.mockImplementation(() => {});
  });
  describe("computed", () => {
    describe("navigationElements", () => {
      it("should get undefined when navigationElements are not fetched", () => {
        const { navigationElements } = useNavigation(rootContextMock);
        expect(navigationElements.value).toBeUndefined();
      });
    });
  });

  describe("methods", () => {
    describe("loadNavigationElements", () => {
      it("should fetch navigation elements correcly", async () => {
        mockedGetPage.getStoreNavigation.mockResolvedValueOnce([
          { name: "Clothin", route: { path: "clothing/" } },
          { name: "Sports", route: { path: "sports/" } },
          {
            name: "Accessories & Others",
            route: { path: "accessories-others/" },
          },
        ] as any);

        const { navigationElements, loadNavigationElements } =
          useNavigation(rootContextMock);
        await loadNavigationElements({ depth: 2 });
        expect(navigationElements.value).toHaveLength(3);
      });

      it("should resolve deprecated fetchNavigationElements into loadNavigationElements", async () => {
        mockedGetPage.getStoreNavigation.mockResolvedValueOnce([
          { name: "Clothin", route: { path: "clothing/" } },
          { name: "Sports", route: { path: "sports/" } },
          {
            name: "Accessories & Others",
            route: { path: "accessories-others/" },
          },
        ] as any);

        const { navigationElements, fetchNavigationElements } =
          useNavigation(rootContextMock);
        await fetchNavigationElements(2);
        expect(navigationElements.value).toHaveLength(3);
      });

      it("should return an empty array for navigation if ther is no children", async () => {
        mockedGetPage.getStoreNavigation.mockResolvedValueOnce([] as any);
        const { navigationElements, loadNavigationElements } =
          useNavigation(rootContextMock);
        await loadNavigationElements({ depth: 2 });
        expect(navigationElements.value).toEqual([]);
      });

      it("should return an empty array for navigation if the response is nullish", async () => {
        mockedGetPage.getStoreNavigation.mockResolvedValueOnce(
          undefined as any
        );
        const { navigationElements, loadNavigationElements } =
          useNavigation(rootContextMock);
        await loadNavigationElements({ depth: 2 });
        expect(navigationElements.value).toEqual([]);
      });

      it("should assign empty array for navigation if the response throws an error", async () => {
        mockedGetPage.getStoreNavigation.mockRejectedValueOnce({
          messages: [{ detail: "some error" }],
        });
        const { navigationElements, loadNavigationElements } =
          useNavigation(rootContextMock);
        await loadNavigationElements({ depth: 2 });
        expect(navigationElements.value).toEqual([]);
        expect(consoleErrorSpy).toBeCalledWith(
          "[useNavigation][loadNavigationElements]",
          [{ detail: "some error" }]
        );
      });
    });
  });
});
