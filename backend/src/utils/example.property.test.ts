import * as fc from 'fast-check';

// Example property-based test for backend
describe('Example Property Tests', () => {
  test('JSON parse and stringify round trip', () => {
    fc.assert(fc.property(
      fc.record({
        name: fc.string(),
        age: fc.integer({ min: 0, max: 150 }),
        active: fc.boolean()
      }),
      (obj) => {
        const serialized = JSON.stringify(obj);
        const parsed = JSON.parse(serialized);
        return JSON.stringify(parsed) === serialized;
      }
    ), { numRuns: 100 });
  });

  test('array sort preserves length', () => {
    fc.assert(fc.property(
      fc.array(fc.integer()),
      (arr) => {
        const originalLength = arr.length;
        const sorted = [...arr].sort((a, b) => a - b);
        return sorted.length === originalLength;
      }
    ), { numRuns: 100 });
  });
});