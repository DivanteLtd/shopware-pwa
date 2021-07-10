import FilterInterface from "./FilterInterface";

export const LTE = "lte";
export const LT = "lt";
export const GTE = "gte";
export const GT = "gt";

export default class RangeFilter implements FilterInterface {
  type: "range";

  field: string;

  parameters;

  constructor(field: string, parameters) {
    this.field = field;
    this.parameters = parameters;
  }

  supports(element) {
    return this.field in element;
  }

  match(element): boolean {
    if (LTE in this.parameters) {
      return element[this.field] <= this.parameters[LTE];
    }
    if (LT in this.parameters) {
      return element[this.field] < this.parameters[LT];
    }
    if (GTE in this.parameters) {
      return element[this.field] >= this.parameters[GTE];
    }
    if (GT in this.parameters) {
      return element[this.field] > this.parameters[GT];
    }
    return false;
  }
}
