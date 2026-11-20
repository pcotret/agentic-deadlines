const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const elements = Object.fromEntries(["search", "tag", "year", "status", "heading", "count", "list", "stats"]
  .map(id => [id, {value: id === "status" ? "all" : "", innerHTML: "", textContent: "", options: [], add(option) { this.options.push(option); }, addEventListener() {}}]));
const data = {conferences: [{
  id: "example", acronym: "EX", tags: ["Security"], editions: [
    {year: 2026, name: "EX 2026", description: "First", location: "Here", conference_dates: "TBA", website: "https://first.example", deadlines: [
      {round: 1, kind: "submission", deadline: "2026-01-01T23:59:00", timezone: "UNSPECIFIED"}
    ]},
    {year: 2027, name: "EX 2027", description: "Second", location: "There", conference_dates: "TBA", website: "https://second.example", deadlines: [
      {round: 1, kind: "abstract", deadline: "2027-01-01T23:59:00", timezone: "UNSPECIFIED"},
      {round: 2, kind: "submission", deadline: "2027-01-08T23:59:00", timezone: "AoE"}
    ]},
    {year: 2028, name: "EX 2028", description: "Third", location: "TBA", conference_dates: "TBA", website: null, deadlines: [
      {round: 1, kind: "submission", deadline: "2028-01-01T23:59:00", timezone: "UNSPECIFIED"}
    ]}
  ]
}]};
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [2027, 0, 1, 23, 59, 59])); }
}
const context = {
  document: {querySelector: selector => elements[selector.slice(1)]},
  Option: function(text, value) { this.text = text; this.value = value; },
  fetch: async () => ({json: async () => data}),
  Intl, Date: FixedDate, console
};
vm.createContext(context);
vm.runInContext(fs.readFileSync("app.js", "utf8"), context);
setImmediate(() => {
  assert.equal(elements.count.textContent, "4 deadlines");
  assert.deepEqual(elements.year.options.map(x => x.value), [2026, 2027, 2028]);
  assert.match(elements.list.innerHTML, /https:\/\/first\.example/);
  assert.match(elements.list.innerHTML, /https:\/\/second\.example/);
  assert.match(elements.list.innerHTML, /<span class="name">EX 2028<\/span>/);
  assert.match(elements.list.innerHTML, /AoE/);
  assert.match(elements.list.innerHTML, /AoE assumed; source unspecified/);
  assert.match(elements.list.innerHTML, /abstract/);
  assert.equal(vm.runInContext('deadlineInstant("2027-01-01T23:59:00", "UNSPECIFIED")', context), Date.parse("2027-01-02T11:59:00Z"));
  assert.equal(vm.runInContext('deadlineInstant("2027-01-01T23:59:00", "AoE")', context), Date.parse("2027-01-02T11:59:00Z"));
  assert.equal(vm.runInContext('deadlineInstant("2027-01-01T23:59:00", "UTC+02:30")', context), Date.parse("2027-01-01T21:29:00Z"));
  assert.equal(vm.runInContext('deadlineInstant("2027-01-01T23:59:00", "UTC")', context), Date.parse("2027-01-01T23:59:00Z"));
  assert.equal(vm.runInContext('deadlineState({deadline:"2027-01-01T23:59:00", timezone:"UNSPECIFIED"}, Date.parse("2027-01-02T11:58:59Z")).past', context), false);
  assert.equal(vm.runInContext('deadlineState({deadline:"2027-01-01T23:59:00", timezone:"UNSPECIFIED"}, Date.parse("2027-01-02T11:59:01Z")).past', context), true);
  assert.match(vm.runInContext('deadlineState({deadline:"2027-01-01T23:59:00", timezone:"America/New_York"}, Date.parse("2027-01-02T11:59:01Z")).left', context), /date only/);
  elements.year.value = "2027";
  vm.runInContext("render()", context);
  assert.equal(elements.count.textContent, "2 deadlines");
  assert.doesNotMatch(elements.list.innerHTML, /EX 2026|EX 2028/);
  elements.year.value = "";
  elements.search.value = "there";
  vm.runInContext("render()", context);
  assert.equal(elements.count.textContent, "2 deadlines");
  elements.search.value = "";
  elements.status.value = "upcoming";
  vm.runInContext("render()", context);
  assert.equal(elements.count.textContent, "3 deadlines");
  elements.status.value = "past";
  vm.runInContext("render()", context);
  assert.equal(elements.count.textContent, "1 deadline");
});
