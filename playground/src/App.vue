<template>
  <div>
    <OpenstreetMapAutocomplete v-model="selectedLocation" />

    <div v-if="selectedLocation" class="location-details">
      <h3>{{ selectedLocation.display_name }}</h3>
      <p>Latitude: {{ selectedLocation.lat }}</p>
      <p>Longitude: {{ selectedLocation.lon }}</p>
    </div>
  </div>
</template>

<script setup>
import { OpenstreetMapAutocomplete } from "../../src/index";
import { ref } from "vue";
const selectedLocation = ref(null);
</script>
