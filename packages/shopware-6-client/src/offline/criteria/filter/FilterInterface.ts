interface FilterInterface {
  type: string;
  supports: SupportsFunction;
  match: MatchFunction;
}

interface SupportsFunction {
  (element): boolean;
}

interface MatchFunction {
  (element): boolean;
}

export default FilterInterface;
