// Mock Vue Composition API onMounted method
import vueComp, { ref } from "vue-demi";
const mockedCompositionAPI = vueComp as jest.Mocked<typeof vueComp>;

import * as Composables from "@shopware-pwa/composables";
jest.mock("@shopware-pwa/composables");
const mockedComposables = Composables as jest.Mocked<typeof Composables>;

// Mock API client
import * as shopwareClient from "@shopware-pwa/shopware-6-client";
jest.mock("@shopware-pwa/shopware-6-client");
const mockedApiClient = shopwareClient as jest.Mocked<typeof shopwareClient>;

import { useSalutations } from "../src/hooks/useSalutations";

describe("Composables - useSalutations", () => {
  const rootContextMock: any = {
    $shopwareApiInstance: jest.fn(),
  };
  const stateSharedRef = ref();
  mockedCompositionAPI.getCurrentInstance = jest.fn();
  mockedCompositionAPI.onMounted = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    stateSharedRef.value = null;

    mockedCompositionAPI.getCurrentInstance.mockReturnValue(rootContextMock);

    mockedComposables.useSharedState.mockImplementation(() => {
      return {
        sharedRef: () => stateSharedRef,
      } as any;
    });
  });
  describe("computed", () => {
    describe("getMappedSalutations", () => {
      it("should contain empty array when there aren't any available salutations", async () => {
        mockedApiClient.getAvailableSalutations.mockReturnValueOnce(
          null as any
        );
        const { getSalutations, fetchSalutations } =
          useSalutations(rootContextMock);
        await fetchSalutations();
        expect(getSalutations.value).toEqual([]);
      });
      it("should contain properly fetched salutations", async () => {
        const { getSalutations, fetchSalutations } =
          useSalutations(rootContextMock);
        mockedApiClient.getAvailableSalutations.mockReturnValueOnce({
          elements: [
            {
              displayName: "Mr.",
              id: "id",
              salutationKey: "salutatonKey",
              letterName: "Dear Mr.",
            },
            {
              displayName: "Mrs.",
              id: "id",
              salutationKey: "salutatonKey",
              letterName: "Dear Mrs.",
            },
          ],
        } as any);
        await fetchSalutations();

        expect(getSalutations.value).toEqual([
          {
            displayName: "Mr.",
            id: "id",
            salutationKey: "salutatonKey",
            letterName: "Dear Mr.",
          },
          {
            displayName: "Mrs.",
            id: "id",
            salutationKey: "salutatonKey",
            letterName: "Dear Mrs.",
          },
        ]);
      });
    });
  });
  describe("methods", () => {
    describe("fetchSalutations", () => {
      it("should assing error to error message if getAvailableSalutations throws one", async () => {
        mockedApiClient.getAvailableSalutations.mockRejectedValueOnce({
          messages: [{ detail: "Couldn't fetch available salutations." }],
        });
        const { fetchSalutations, error } = useSalutations(rootContextMock);
        await fetchSalutations();
        expect(error.value).toStrictEqual([
          { detail: "Couldn't fetch available salutations." },
        ]);
      });
    });
    describe("onMounted", () => {
      it("should call onMounted at composable call", () => {
        useSalutations(rootContextMock);
        expect(vueComp.onMounted).toBeCalled();
      });
    });
    describe("onMountedCallback", () => {
      it("should call fetchSalutations when getSalutations is an empty list", async () => {
        mockedApiClient.getAvailableSalutations.mockReturnValueOnce({
          elements: null,
        } as any);
        const { mountedCallback, getSalutations, fetchSalutations } =
          useSalutations(rootContextMock);
        await fetchSalutations();
        mockedApiClient.getAvailableSalutations.mockReturnValueOnce({
          elements: [
            {
              displayName: "Mr.",
              id: "id",
              salutationKey: "salutatonKey",
              letterName: "Dear Mr.",
            },
            {
              displayName: "Mrs.",
              id: "id",
              salutationKey: "salutatonKey",
              letterName: "Dear Mrs.",
            },
          ],
        } as any);
        await mountedCallback();
        expect(getSalutations.value).toEqual([
          {
            displayName: "Mr.",
            id: "id",
            salutationKey: "salutatonKey",
            letterName: "Dear Mr.",
          },
          {
            displayName: "Mrs.",
            id: "id",
            salutationKey: "salutatonKey",
            letterName: "Dear Mrs.",
          },
        ]);
      });
      it("should not call fetch salutations when getSalutations is not an empty list", async () => {
        mockedApiClient.getAvailableSalutations.mockReturnValueOnce({
          elements: [
            {
              displayName: "Not specified",
              id: "id",
              salutationKey: "salutatonKey",
              letterName: "Dear Mr./Mrs.",
            },
            {
              displayName: "Mrs.",
              id: "id",
              salutationKey: "salutatonKey",
              letterName: "Dear Mrs.",
            },
          ],
        } as any);
        const { mountedCallback, getSalutations, fetchSalutations } =
          useSalutations(rootContextMock);
        await fetchSalutations();
        mockedApiClient.getAvailableSalutations.mockReturnValueOnce({
          elements: [
            {
              displayName: "Mr.",
              id: "id",
              salutationKey: "salutatonKey",
              letterName: "Dear Mr.",
            },
            {
              displayName: "Mrs.",
              id: "id",
              salutationKey: "salutatonKey",
              letterName: "Dear Mrs.",
            },
          ],
        } as any);
        await mountedCallback();
        // do not replace if salutations are loaded already
        expect(getSalutations.value).toEqual([
          {
            displayName: "Not specified",
            id: "id",
            salutationKey: "salutatonKey",
            letterName: "Dear Mr./Mrs.",
          },
          {
            displayName: "Mrs.",
            id: "id",
            salutationKey: "salutatonKey",
            letterName: "Dear Mrs.",
          },
        ] as any);
      });
    });
  });
});
