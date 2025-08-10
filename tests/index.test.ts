import { mount } from "@vue/test-utils";
import { describe, expect, test, vi, beforeEach } from "vitest";
import OpenStreetMapAutocomplete from "../src/OpenStreetMapAutocomplete.vue";
import { nextTick } from "vue";

describe("OpenStreetMapAutocomplete", () => {
  const mockLocation = {
    place_id: 123,
    licence: "Test Licence",
    osm_type: "node",
    osm_id: 456,
    lat: "51.5074",
    lon: "-0.1278",
    category: "place",
    type: "city",
    place_rank: 15,
    importance: 0.9,
    addresstype: "city",
    name: "Test Location",
    display_name: "Test Location, City, Country",
    boundingbox: ["51.0", "52.0", "-0.5", "0.5"],
  };

  const mockResponse = {
    ok: true,
    status: 200,
    headers: new Headers(),
    redirected: false,
    statusText: "OK",
    type: "basic",
    url: "",
    json: () => Promise.resolve([mockLocation]),
    text: () => Promise.resolve(""),
    blob: () => Promise.resolve(new Blob()),
    clone: () => mockResponse,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    body: null,
    bodyUsed: false,
  } as Response;

  beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve(mockResponse));
    vi.clearAllMocks();
  });

  test("renders correctly with default props", () => {
    const wrapper = mount(OpenStreetMapAutocomplete);

    expect(wrapper.find("input").exists()).toBe(true);
    expect(wrapper.find("button").exists()).toBe(true);
    expect(wrapper.find("input").attributes("placeholder")).toBe(
      "Search location",
    );
  });

  test("updates input value when modelValue changes", async () => {
    const wrapper = mount(OpenStreetMapAutocomplete, {
      props: {
        modelValue: null,
      },
    });

    await wrapper.setProps({ modelValue: mockLocation });
    expect(wrapper.find("input").element.value).toBe(mockLocation.display_name);
  });

  test("shows dropdown when input is focused", async () => {
    const wrapper = mount(OpenStreetMapAutocomplete);

    await wrapper.find("input").trigger("focus");
    expect(wrapper.find(".autocomplete-dropdown").exists()).toBe(true);
  });

  test("debounces API calls on input", async () => {
    vi.useFakeTimers();
    const wrapper = mount(OpenStreetMapAutocomplete);
    const input = wrapper.find("input");

    await input.setValue("London");
    vi.advanceTimersByTime(200); // Not enough to trigger
    expect(global.fetch).not.toHaveBeenCalled();

    await input.setValue("New York");
    vi.advanceTimersByTime(300); // Default debounce time
    expect(global.fetch).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  test("displays search results", async () => {
    const wrapper = mount(OpenStreetMapAutocomplete);

    // Trigger input and focus
    await wrapper.find("input").trigger("focus");
    await wrapper.find("input").setValue("Paris");

    // Wait for debounce and API call
    await new Promise((resolve) => setTimeout(resolve, 300));
    await nextTick();
    await nextTick();

    // Assertions
    expect(wrapper.findAll(".autocomplete-option")).toHaveLength(1);
    expect(wrapper.find(".autocomplete-option").text()).toBe(
      mockLocation.display_name,
    );
  });

  test("selects option on click", async () => {
    const wrapper = mount(OpenStreetMapAutocomplete);

    // Set up and trigger search
    await wrapper.find("input").trigger("focus");
    await wrapper.find("input").setValue("Berlin");
    await new Promise((resolve) => setTimeout(resolve, 300));
    await nextTick();

    // Select option
    await wrapper.find(".autocomplete-option").trigger("mousedown");

    // Verify selection
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([mockLocation]);
    expect(wrapper.find(".autocomplete-dropdown").exists()).toBe(false);
  });

  test("handles keyboard navigation", async () => {
    const wrapper = mount(OpenStreetMapAutocomplete);

    // Set up and trigger search
    await wrapper.find("input").trigger("focus");
    await wrapper.find("input").setValue("Madrid");
    await new Promise((resolve) => setTimeout(resolve, 300));
    await nextTick();

    // Arrow down navigation
    await wrapper.find("input").trigger("keydown", { key: "ArrowDown" });
    expect(wrapper.find(".is-highlighted").exists()).toBe(true);

    // Enter to select
    await wrapper.find("input").trigger("keydown", { key: "Enter" });
    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
  });

  test("shows empty state when no results", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ...mockResponse,
        json: () => Promise.resolve([]),
      }),
    );

    const wrapper = mount(OpenStreetMapAutocomplete);
    await wrapper.find("input").trigger("focus");
    await wrapper.find("input").setValue("Unknown Place");
    await new Promise((resolve) => setTimeout(resolve, 300));
    await nextTick();

    expect(wrapper.find(".autocomplete-empty").exists()).toBe(true);
    expect(wrapper.find(".autocomplete-empty").text()).toBe(
      "No locations found",
    );
  });

  test("closes dropdown when clicking outside", async () => {
    const wrapper = mount(OpenStreetMapAutocomplete);
    await wrapper.find("input").trigger("focus");
    expect(wrapper.find(".autocomplete-dropdown").exists()).toBe(true);

    document.dispatchEvent(new MouseEvent("click"));
    await nextTick();
    expect(wrapper.find(".autocomplete-dropdown").exists()).toBe(false);
  });

  test("applies custom classes and styles", async () => {
    const wrapper = mount(OpenStreetMapAutocomplete, {
      props: {
        classes: {
          root: "custom-root",
          input: "custom-input",
        },
        styles: {
          root: { backgroundColor: "red" },
        },
      },
    });

    expect(wrapper.find(".custom-root").exists()).toBe(true);
    expect(wrapper.find(".custom-input").exists()).toBe(true);
    expect(wrapper.find(".autocomplete").attributes("style")).toContain(
      "background-color: red",
    );
  });

  test("uses custom endpoint when provided", async () => {
    const customEndpoint = "https://custom-osm-endpoint.com/search";
    const wrapper = mount(OpenStreetMapAutocomplete, {
      props: { endpoint: customEndpoint },
    });

    await wrapper.find("input").trigger("focus");
    await wrapper.find("input").setValue("Tokyo");
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(customEndpoint),
    );
  });
});
