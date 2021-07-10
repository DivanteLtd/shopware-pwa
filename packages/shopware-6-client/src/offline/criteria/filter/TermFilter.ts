import FilterInterface from "./FilterInterface";

export default class TermFilter implements FilterInterface {
  type: "term";

  term: string;

  constructor(term: string) {
    this.term = term;
  }

  supports(element) {
    return typeof element.name !== "undefined";
  }

  match(element): boolean {
    return element?.name?.includes(this.term);
  }
}
