# vue-osm-autocomplete

A Vue 3 autocomplete component for location search using OpenStreetMap's
Nominatim API. This component provides a user-friendly interface for
searching locations with debounced API calls, keyboard navigation,
and customizable styling.

## Features

- Autocomplete search for locations using the Nominatim API.
- Supports keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`, `Tab`).
- Accessible with ARIA attributes for screen reader support.
- Customizable styles and classes for flexible integration.
- Debounced API requests to optimize performance.
- Emits events for selection and errors.

## Installation

Install the component and its dependency:

```bash
npm install vue-osm-autocomplete
```

## Usage

Import and use the component in your Vue 3 application:

```vue
<template>
  <OpenStreetMapAutocomplete
    v-model="selectedLocation"
    placeholder="Search for a place"
    @search-error="handleError"
  />
</template>

<script setup>
import { ref } from "vue";
import OpenStreetMapAutocomplete from "vue-osm-autocomplete";

const selectedLocation = ref(null);
const handleError = (error) => console.error("Search error:", error);
</script>
```

## Props

| Prop            | Type                               | Default                                        | Description                                            |
| --------------- | ---------------------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| `modelValue`    | `OpenStreetMapLocation \| null`    | `null`                                         | The selected location object (v-model).                |
| `debounce`      | `number`                           | `300`                                          | Debounce time for API requests (in milliseconds).      |
| `placeholder`   | `string`                           | `"Search location"`                            | Placeholder text for the input field.                  |
| `noResultsText` | `string`                           | `"No locations found"`                         | Text displayed when no search results are found.       |
| `endpoint`      | `string`                           | `"https://nominatim.openstreetmap.org/search"` | Nominatim API endpoint URL.                            |
| `language`      | `string`                           | `"en"`                                         | Language for API results (e.g., `"en"`, `"fr"`).       |
| `classes`       | `OpenStreetMapAutocompleteClasses` | `undefined`                                    | Custom CSS classes for component elements (see below). |
| `styles`        | `OpenStreetMapAutocompleteStyles`  | `undefined`                                    | Inline styles for component elements (see below).      |

### `OpenStreetMapLocation` Interface

```ts
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
```

### `OpenStreetMapAutocompleteClasses` Interface

```ts
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
```

### `OpenStreetMapAutocompleteStyles` Interface

```ts
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
```

## Events

| Event               | Payload                         | Description                          |
| ------------------- | ------------------------------- | ------------------------------------ |
| `update:modelValue` | `OpenStreetMapLocation \| null` | Emitted when a location is selected. |
| `search-error`      | `unknown`                       | Emitted when an API error occurs.    |

## Slots

| Slot   | Description                        |
| ------ | ---------------------------------- |
| `icon` | Custom icon for the search button. |

### Example with Custom Icon

```vue
<template>
  <OpenStreetMapAutocomplete v-model="selectedLocation">
    <template #icon>
      <svg viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    </template>
  </OpenStreetMapAutocomplete>
</template>
```

## Styling

The component uses scoped CSS with the following class structure:

- `.autocomplete`: Root container.
- `.autocomplete-form`: Form element.
- `.autocomplete-input-wrapper`: Input wrapper.
- `.autocomplete-input`: Input element.
- `.autocomplete-divider`: Divider between input and button.
- `.autocomplete-button`: Search button.
- `.autocomplete-dropdown`: Dropdown container.
- `.autocomplete-options`: Options list.
- `.autocomplete-option`: Individual option (with `.is-highlighted` and `.is-selected` modifiers).
- `.autocomplete-empty`: No results message.
- `.autocomplete-loading`: Loading spinner.

You can override styles using the `classes` or `styles` props:

```vue
<template>
  <OpenStreetMapAutocomplete
    v-model="selectedLocation"
    :classes="{ root: 'custom-autocomplete', input: 'custom-input' }"
    :styles="{ root: { backgroundColor: 'lightgray' } }"
  />
</template>

<style>
.custom-autocomplete {
  border-radius: 8px;
}
.custom-input {
  border: 2px solid blue;
}
</style>
```

## Accessibility

- Supports ARIA attributes (`role="combobox"`, `aria-expanded`, `aria-controls`, etc.).
- Keyboard navigation with `ArrowUp`, `ArrowDown`, `Enter`, `Escape`, and `Tab`.
- Dropdown closes on outside click or `Escape` key.

## Notes

- **Nominatim Usage Policy**: The component uses OpenStreetMap's Nominatim API, which has strict usage limits (max 1 request per second, no heavy load). For production applications, consider:
  - Using a custom `endpoint` with a Nominatim instance or proxy.
  - Implementing client-side caching or rate-limiting on your end.
  - Reviewing the [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/).
- **Dependencies**: Requires `@vueuse/core` for debouncing API requests.
- **Minimum Query Length**: The component requires a minimum of 3 characters before making API requests.
- **Error Handling**: Errors are emitted via the `search-error` event. Implement custom error handling in your application if needed.

## Example with Error Handling

```vue
<template>
  <OpenStreetMapAutocomplete
    v-model="selectedLocation"
    @search-error="handleError"
  />
</template>

<script setup>
import { ref } from "vue";
import OpenStreetMapAutocomplete from "vue-osm-autocomplete";

const selectedLocation = ref(null);
const handleError = (error) => {
  alert("Failed to load locations: " + error.message);
};
</script>
```

## Contributing

Contributions are welcome! Please submit issues or pull requests to the [GitHub repository](https://github.com/Dantescur/vue-osm-autocomplete).

## License

MIT License
