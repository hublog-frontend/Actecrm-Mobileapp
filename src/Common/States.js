import { State } from 'country-state-city';

// Proxy object that dynamically fetches states for any given country code
export const STATE_DATA = new Proxy({}, {
  get: function(target, prop) {
    if (typeof prop === 'string') {
      const states = State.getStatesOfCountry(prop.toUpperCase());
      return states.map(s => ({
        name: s.name,
        code: s.isoCode
      }));
    }
    return [];
  }
});
