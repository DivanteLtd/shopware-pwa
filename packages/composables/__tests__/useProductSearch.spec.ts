import Vue from "vue";
import VueCompositionApi from "@vue/composition-api";
Vue.use(VueCompositionApi);
import { useProductSearch } from "@shopware-pwa/composables";
jest.mock("@shopware-pwa/shopware-6-client");
import * as shopwareClient from "@shopware-pwa/shopware-6-client";
import { SearchFilterType } from "@shopware-pwa/commons/interfaces/search/SearchFilter";
const mockedApi = shopwareClient as jest.Mocked<typeof shopwareClient>;

describe("Composables - useProductSearch", () => {
  console.error = jest.fn();
  const rootContextMock: any = {
    $store: jest.fn(),
    $shopwareApiInstance: jest.fn(),
  };
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("initial values", () => {
    it("should have no listing result if search wasn't performed", async () => {
      const { searchResult } = useProductSearch(rootContextMock);
      expect(searchResult.value).toBeNull();
    });
    it("should have loading value set to false by default", async () => {
      const { loadingSearch } = useProductSearch(rootContextMock);
      expect(loadingSearch.value).toBeFalsy();
    });
  });
  describe("currentPagination", () => {
    it("should have undefined properties if there is no search result", async () => {
      mockedApi.getSearchResults.mockResolvedValueOnce(null as any);
      const { search, currentPagination } = useProductSearch();
      await search("some term");
      expect(currentPagination.value).toStrictEqual({
        currentPage: undefined,
        perPage: undefined,
        total: undefined,
      });
    });
    it("should have proper values under the pagination property", async () => {
      mockedApi.getSearchResults.mockResolvedValueOnce({
        page: 4,
        limit: 10,
        total: 189,
      } as any);
      const { search, currentPagination } = useProductSearch(rootContextMock);
      await search("some term");
      expect(currentPagination.value).toStrictEqual({
        currentPage: 4,
        perPage: 10,
        total: 189,
      });
    });
    it("should get the limit from the currentPagination if there is no pagination in search criteria", async () => {
      mockedApi.getSearchResults.mockResolvedValueOnce({
        page: 4,
        limit: 10,
        total: 189,
      } as any);
      const { search, changePage, currentPagination } = useProductSearch();
      await search("some term");
      expect(currentPagination.value).toStrictEqual({
        currentPage: 4,
        perPage: 10,
        total: 189,
      });
      await changePage(2);
      expect(mockedApi.getSearchResults).toBeCalledWith("some term", {
        manufacturer: [],
        pagination: { limit: undefined, page: 2 },
        properties: [],
        sort: {},
      });
      jest.resetAllMocks();
    });
  });
  describe("currentSearchTerm", () => {
    it("should have current search-term if there is one provided during the search", async () => {
      const { search, currentSearchTerm } = useProductSearch(rootContextMock);
      await search("some term");
      expect(currentSearchTerm.value).toBe("some term");
    });
  });
  describe("suggestSearch", () => {
    it("should have appriopriate API call invoked on search action", async () => {
      const { suggestSearch, suggestionsResult } = useProductSearch(
        rootContextMock
      );
      await suggestSearch("some string");
      expect(mockedApi.getSuggestedResults).toBeCalledTimes(1);
      expect(mockedApi.getSuggestedResults).toBeCalledWith(
        "some string",
        undefined,
        rootContextMock.$shopwareApiInstance
      );
      expect(suggestionsResult.value).toBeUndefined();
    });
    it("should catch and log the error on api call rejection", async () => {
      const { suggestSearch } = useProductSearch(rootContextMock);
      mockedApi.getSuggestedResults.mockRejectedValueOnce({
        message: "Something went wrong",
      } as any);

      await suggestSearch("lucky search");
    });
  });
  describe("search", () => {
    it("should make a second call for full collection of aggregations if it's not a basic search", async () => {
      mockedApi.getSearchResults.mockResolvedValue({
        currentFilters: {
          manufacturer: ["divante"],
        },
        aggregations: {
          manufacturer: {
            entities: [
              {
                translated: {
                  name: "DivanteLtd",
                },
                id: "123456",
              },
            ],
          },
        },
      } as any);

      const { search } = useProductSearch();
      await search("some string");
      expect(mockedApi.getSearchResults).toBeCalledTimes(2);
    });
    it("should return false if there is no active filter set in the payload", async () => {
      mockedApi.getSearchResults.mockResolvedValue({
        currentFilters: {},
        aggregations: {},
      } as any);

      const { search, isBaseSearch } = useProductSearch();
      await search("some string");
      expect(isBaseSearch()).toBe(true);
    });
    it("should return false if there is no active filter set in the payload", async () => {
      mockedApi.getSearchResults.mockResolvedValue({
        currentFilters: {
          manufacturer: null,
          properties: [],
        },
        aggregations: {},
      } as any);

      const { search, isBaseSearch } = useProductSearch();
      await search("some string");
      expect(isBaseSearch()).toBe(true);
    });
    it("should return false if there is no active filter set in the payload", async () => {
      mockedApi.getSearchResults.mockResolvedValue(null as any);

      const { search, isBaseSearch } = useProductSearch();
      await search("some string");
      expect(isBaseSearch()).toBe(true);
    });
    it("should set available filters if it's a base search with aggregations for whole collection", async () => {
      mockedApi.getSearchResults.mockResolvedValueOnce({
        page: 4,
        limit: 10,
        total: 189,
        aggregations: {
          manufacturer: {
            entities: [
              {
                translated: {
                  name: "DivanteLtd",
                },
                id: "123456",
              },
            ],
          },
        },
      } as any);
      const { search, availableFilters } = useProductSearch();
      await search("some string");
      expect(availableFilters.value).toStrictEqual([
        {
          name: "manufacturer",
          options: [
            {
              color: false,
              label: "DivanteLtd",
              value: "123456",
            },
          ],
          type: "entity",
        },
      ]);
    });
    it("should have appriopriate API call invoked on search action", async () => {
      const { search, resetFilters } = useProductSearch();
      resetFilters();
      await search("some string");
      expect(mockedApi.getSearchResults).toBeCalledTimes(1);
      expect(mockedApi.getSearchResults).toBeCalledWith("some string", {
        manufacturer: [],
        properties: [],
        sort: {},
        pagination: {
          limit: undefined,
          page: undefined,
        },
      });
    });
    it("should have product returned if search term provided", async () => {
      mockedApi.getSearchResults.mockResolvedValueOnce({
        data: [{ name: "some string" }],
      } as any);
      const { search, searchResult } = useProductSearch(rootContextMock);
      await search("some string");
      expect(searchResult.value).toStrictEqual({
        data: [{ name: "some string" }],
      });
    });
    it("should not perform search without any term provided", async () => {
      const { search, searchResult } = useProductSearch(rootContextMock);
      await search(undefined as any);
      expect(mockedApi.getSearchResults).toBeCalledTimes(0);
      expect(searchResult.value).toStrictEqual(null);
    });
    it("should have error on rejection from API client", async () => {
      mockedApi.getSearchResults.mockRejectedValueOnce({
        message: "Something went wrong",
      } as any);

      const { search, searchResult } = useProductSearch(rootContextMock);
      try {
        await search("test");
      } catch (e) {
        expect(e).toStrictEqual({ message: "Something went wrong" });
      }

      expect(mockedApi.getSearchResults).toBeCalledTimes(1);
      expect(searchResult.value).toStrictEqual(null);
    });
  });
  describe("changePage", () => {
    it("should append the provided page to the pagination object", async () => {
      const { search, changePage } = useProductSearch(rootContextMock);
      await search("test");
      await changePage(5);
      expect(mockedApi.getSearchResults).toBeCalledWith("test", {
        pagination: { limit: undefined, page: 5 },
        manufacturer: [],
        properties: [],
        sort: {},
      });
      expect(mockedApi.getSearchResults).toBeCalledTimes(2);
    });
  });
  describe("changeSorting", () => {
    it("should invoke getSearchResults with provided sorting config", async () => {
      const { search, changeSorting } = useProductSearch();
      await search("test");
      await changeSorting({
        field: "name",
        name: "name-desc",
        desc: true,
      });
      expect(mockedApi.getSearchResults).toBeCalledWith("test", {
        manufacturer: [],
        properties: [],
        pagination: {
          limit: undefined,
          page: 5,
        },
        sort: {
          field: "name",
          name: "name-desc",
          order: "desc",
        },
      });
      expect(mockedApi.getSearchResults).toBeCalledTimes(2);
    });
    it("should not invoke getSearchResults if no sorting was provided", async () => {
      const { search, changeSorting } = useProductSearch();
      await search("test");
      await changeSorting(undefined as any);
      expect(mockedApi.getSearchResults).toBeCalledTimes(1);
    });
  });
  describe("toggleFilter", () => {
    it("should not set the filters array to selectedCriteria if selectedFilterBucket is empty", async () => {
      const { toggleFilter, search, resetFilters } = useProductSearch();
      resetFilters();
      toggleFilter(
        {
          field: "aaaaaaa",
          value: undefined,
        } as any,
        false
      );
      await search("some term");

      expect(mockedApi.getSearchResults).toBeCalledWith("some term", {
        manufacturer: [],
        properties: [],
        pagination: {
          limit: undefined,
          page: undefined,
        },
        sort: {},
      });
    });
    it("should not select filter if it has wrong format", () => {
      const { toggleFilter, selectedFilters } = useProductSearch();
      toggleFilter(undefined as any, false);
      expect(selectedFilters.value).toStrictEqual([]);
    });
    it("should trigger ToggleSelectedFilter on toggleFilter run", () => {
      const { toggleFilter, selectedFilters } = useProductSearch();
      toggleFilter(
        {
          type: SearchFilterType.EQUALS,
          value: "white",
          field: "color",
        },
        false
      );
      expect(selectedFilters.value).toStrictEqual(["white"]);
    });
    it("should call getSearchResults with transformed filters if any provided", async () => {
      const { toggleFilter, search } = useProductSearch();
      toggleFilter(
        {
          type: SearchFilterType.EQUALS,
          value: "white",
          field: "color",
        },
        false
      );
      await search("t-shirt");
      expect(mockedApi.getSearchResults).toBeCalledTimes(1);
      expect(mockedApi.getSearchResults).toBeCalledWith("t-shirt", {
        manufacturer: [],
        properties: ["white"],
        pagination: {
          limit: undefined,
          page: undefined,
        },
        sort: {},
      });
    });
  });
  describe("resetFilters", () => {
    it("should removed all filters from selectedFilters computed property", () => {
      const {
        toggleFilter,
        selectedFilters,
        resetFilters,
      } = useProductSearch();
      toggleFilter(
        {
          type: SearchFilterType.EQUALS,
          value: "white",
          field: "color",
        },
        false
      );
      expect(selectedFilters.value).toStrictEqual(["white"]);
      resetFilters();
      expect(selectedFilters.value).not.toBe(["white"]);
    });
  });
});
