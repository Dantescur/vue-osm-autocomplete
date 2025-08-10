<template>
  <div
    ref="wrapperRef"
    class="autocomplete"
    :class="classes?.root"
    :style="styles?.root"
  >
    <form
      class="autocomplete-form"
      :class="classes?.form"
      :style="styles?.form"
      @submit.prevent="handleSubmit"
      role="search"
    >
      <div
        class="autocomplete-input-wrapper"
        :class="classes?.inputWrapper"
        :style="styles?.inputWrapper"
      >
        <input
          ref="inputRef"
          type="text"
          :placeholder="placeholder"
          :value="inputValue"
          @input="handleInput"
          @focus="showOptions"
          @keydown="handleKeyDown"
          @blur="handleBlur"
          :class="classes?.input"
          :style="styles?.input"
          :aria-expanded="showDropdown"
          aria-autocomplete="list"
          aria-controls="autocomplete-list"
          aria-label="Search location"
          role="combobox"
        />
      </div>
      <div
        class="autocomplete-divider"
        :class="classes?.divider"
        :style="styles?.divider"
      />
      <button
        type="submit"
        class="autocomplete-button"
        :class="classes?.button"
        :style="styles?.button"
        aria-label="Search"
      >
        <slot name="icon">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
            />
          </svg>
        </slot>
      </button>
    </form>

    <div
      v-if="showDropdown"
      ref="dropdownRef"
      class="autocomplete-dropdown"
      :class="classes?.dropdown"
      :style="styles?.dropdown"
    >
      <div v-if="isLoading" class="autocomplete-loading">
        <svg class="spinner" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
        </svg>
      </div>
      <ul
        v-if="!isLoading"
        id="autocomplete-list"
        class="autocomplete-options"
        :class="classes?.options"
        :style="styles?.options"
        role="listbox"
      >
        <li
          v-for="(option, index) in options"
          :key="`${option.osm_id}-${index}`"
          :id="`option-${index}`"
          class="autocomplete-option"
          :class="{
            'is-highlighted': index === highlightedIndex,
            'is-selected': isOptionSelected(option),
            ...(classes?.option ? { [classes.option]: true } : {}),
          }"
          @mousedown.prevent="selectOption(option)"
          @click="selectOption(option)"
          @mouseenter="highlightedIndex = index"
          role="option"
          :aria-selected="isOptionSelected(option)"
        >
          {{ option.display_name }}
        </li>
      </ul>
      <div
        v-if="!isLoading && options.length === 0 && inputValue"
        class="autocomplete-empty"
        :class="classes?.empty"
        :style="styles?.empty"
      >
        {{ noResultsText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useDebounceFn } from "@vueuse/core";

interface OpenStreetMapLocation {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  category: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  boundingbox: string[];
}

interface OpenStreetMapAutocompleteStyles {
  root?: Record<string, string>;
  form?: Record<string, string>;
  inputWrapper?: Record<string, string>;
  input?: Record<string, string>;
  divider?: Record<string, string>;
  button?: Record<string, string>;
  dropdown?: Record<string, string>;
  options?: Record<string, string>;
  option?: Record<string, string>;
  empty?: Record<string, string>;
  loading?: Record<string, string>;
}

interface OpenStreetMapAutocompleteClasses {
  root?: string;
  form?: string;
  inputWrapper?: string;
  input?: string;
  divider?: string;
  button?: string;
  dropdown?: string;
  options?: string;
  option?: string;
  empty?: string;
  loading?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue?: OpenStreetMapLocation | null;
    debounce?: number;
    placeholder?: string;
    noResultsText?: string;
    endpoint?: string;
    language?: string;
    classes?: OpenStreetMapAutocompleteClasses;
    styles?: OpenStreetMapAutocompleteStyles;
  }>(),
  {
    debounce: 300,
    placeholder: "Search location",
    noResultsText: "No locations found",
    endpoint: "https://nominatim.openstreetmap.org/search",
    language: "en",
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: OpenStreetMapLocation | null): void;
  (e: "search-error", value: unknown): void;
}>();

const wrapperRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const inputValue = ref("");
const options = ref<OpenStreetMapLocation[]>([]);
const highlightedIndex = ref(-1);
const showDropdown = ref(false);
const isMouseInteraction = ref(false);
const isLoading = ref(false);

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue?.display_name !== inputValue.value) {
      inputValue.value = newValue?.display_name || "";
    }
  },
  { immediate: true },
);

const fetchLocations = useDebounceFn(async (query: string) => {
  if (!query.trim() || query.length < 3) {
    options.value = [];
    return;
  }

  isLoading.value = true;
  try {
    const url = new URL(props.endpoint);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("accept-language", props.language);
    url.searchParams.set("limit", "10");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString());
    const data = (await response.json()) as OpenStreetMapLocation[];
    options.value = data;
  } catch (error) {
    emit("search-error", error);
    options.value = [];
  } finally {
    isLoading.value = false;
  }
}, props.debounce);

const handleInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  inputValue.value = value;
  fetchLocations(value);
  showDropdown.value = true;
};

const showOptions = () => {
  showDropdown.value = true;
  highlightedIndex.value = -1;
};

const hideOptions = () => {
  if (isMouseInteraction.value) {
    isMouseInteraction.value = false;
    return;
  }
  showDropdown.value = false;
  highlightedIndex.value = -1;
};

const isOptionSelected = (option: OpenStreetMapLocation) => {
  return props.modelValue?.osm_id === option.osm_id;
};

const selectOption = (option: OpenStreetMapLocation) => {
  inputValue.value = option.display_name;
  emit("update:modelValue", option);
  hideOptions();
  if (inputRef.value) {
    inputRef.value.blur();
  }
};

const handleSubmit = (event: Event) => {
  event.preventDefault();

  if (highlightedIndex.value >= 0 && options.value[highlightedIndex.value]) {
    selectOption(options.value[highlightedIndex.value]);
  } else if (inputValue.value) {
    fetchLocations(inputValue.value);
    showOptions();
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (!showDropdown.value) return;

  const { key } = event;
  const optionsCount = options.value.length;

  switch (key) {
    case "ArrowDown":
      event.preventDefault();
      highlightedIndex.value = (highlightedIndex.value + 1) % optionsCount;
      scrollToHighlighted();
      break;
    case "ArrowUp":
      event.preventDefault();
      highlightedIndex.value =
        (highlightedIndex.value - 1 + optionsCount) % optionsCount;
      scrollToHighlighted();
      break;
    case "Enter":
      if (
        highlightedIndex.value >= 0 &&
        options.value[highlightedIndex.value]
      ) {
        event.preventDefault();
        selectOption(options.value[highlightedIndex.value]);
      }
      break;
    case "Escape":
      hideOptions();
      break;
    case "Tab":
      if (
        highlightedIndex.value >= 0 &&
        options.value[highlightedIndex.value]
      ) {
        selectOption(options.value[highlightedIndex.value]);
      }
      break;
  }
};

const handleBlur = () => {
  // Use setTimeout to allow click events to process
  setTimeout(() => {
    if (!wrapperRef.value?.contains(document.activeElement)) {
      hideOptions();
    }
  }, 100);
};

const scrollToHighlighted = () => {
  if (highlightedIndex.value >= 0 && dropdownRef.value) {
    const optionElement = document.getElementById(
      `option-${highlightedIndex.value}`,
    );
    if (optionElement) {
      optionElement.scrollIntoView({ block: "nearest" });
    }
  }
};

// Handle click outside
const handleClickOutside = (event: MouseEvent) => {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target as Node)) {
    hideOptions();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("mousedown", () => {
    isMouseInteraction.value = true;
  });
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("mousedown", () => {
    isMouseInteraction.value = true;
  });
});
</script>

<style scoped>
.autocomplete {
  position: relative;
  width: 100%;
}

.autocomplete-form {
  display: flex;
  align-items: center;
  width: 100%;
}

.autocomplete-input-wrapper {
  flex: 1;
}

.autocomplete-input-wrapper input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.autocomplete-input-wrapper input:focus {
  outline: 2px solid #0066cc;
  border-color: transparent;
}

.autocomplete-divider {
  width: 1px;
  height: 1.5rem;
  margin: 0 0.5rem;
  background-color: #ccc;
}

.autocomplete-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
}

.autocomplete-button:hover {
  color: #333;
}

.autocomplete-button:focus {
  outline: 2px solid #0066cc;
  border-radius: 4px;
}

.autocomplete-button svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: currentColor;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 20rem;
  overflow-y: auto;
  margin-top: 0.25rem;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.autocomplete-options {
  list-style: none;
  padding: 0;
  margin: 0;
  color: gray;
}

.autocomplete-option {
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.autocomplete-option:hover {
  background-color: #f5f5f5;
}

.autocomplete-option.is-highlighted {
  background-color: #ebebeb;
}

.autocomplete-option.is-selected {
  background-color: #e0e0e0;
}

.autocomplete-empty {
  padding: 0.75rem 1rem;
  color: #666;
  font-style: italic;
}

.autocomplete-loading {
  padding: 0.75rem 1rem;
  color: #666;
  text-align: center;
  font-style: italic;
}

.spinner {
  animation: rotate 2s linear infinite;
  width: 20px;
  height: 20px;
  margin: 0 auto;
}
.spinner circle {
  stroke: #0066cc;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}
@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}
@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
</style>
