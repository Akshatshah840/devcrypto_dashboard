import * as fc from 'fast-check';

// Example property-based test for frontend
describe('Example Property Tests', () => {
  test('string concatenation is associative', () => {
    fc.assert(fc.property(
      fc.string(),
      fc.string(),
      fc.string(),
      (a, b, c) => {
        return (a + b) + c === a + (b + c);
      }
    ), { numRuns: 100 });
  });

  test('array length after push increases by 1', () => {
    fc.assert(fc.property(
      fc.array(fc.integer()),
      fc.integer(),
      (arr, item) => {
        const originalLength = arr.length;
        arr.push(item);
        return arr.length === originalLength + 1;
      }
    ), { numRuns: 100 });
  });
});