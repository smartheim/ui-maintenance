import { fetchWithTimeout } from "../app.js";

class LogViewSimulator {
  constructor(dataCallback) {
    this._dataCallback = dataCallback;
    this._seed = Date.now();
    this._incid = 100;
    this.generate();
  }
  async generate() {
    this.original = await fetchWithTimeout("./dummydata/logs.json").then(d => d.json());
    this._dataCallback({ t: "log", init: this.original });
    this.timer = setInterval(this.addData.bind(this), 1000);
  }
  addData() {
    let d = Object.assign({ t: "log" }, this.original[Math.floor(this.rand(0, 99))]);
    d._id = this._incid;
    ++this._incid;
    this._dataCallback(d);
  }
  dispose() {
    if (this.timer) clearInterval(this.timer);
    delete this.timer;
  }
  rand(min, max) {
    var seed = this._seed;
    min = min === undefined ? 0 : min;
    max = max === undefined ? 1 : max;
    this._seed = (seed * 9301 + 49297) % 233280;
    return min + (this._seed / 233280) * (max - min);
  }
};

export const SimulationGenerator = LogViewSimulator;
