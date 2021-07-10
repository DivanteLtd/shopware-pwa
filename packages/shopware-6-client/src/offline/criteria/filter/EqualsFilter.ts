import FilterInterface from "./FilterInterface";

export default class TermFilter implements FilterInterface {
  type: "term";

  field: string;

  value;

  constructor(field: string, value) {
    this.field = field;
    this.value = value;
  }

  supports(element) {
    return this.field in element;
  }

  match(element): boolean {
    return element[this.field] === this.value;
  }
}
