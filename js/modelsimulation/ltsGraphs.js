
class LtsGraphsSimulation {
  constructor(dataCallback) {
    this._dataCallback = dataCallback;
    this._seed = Date.now();
    this.generateFor("memory");
    this.generateFor("cpu");
    this.generateFor("threads");
  }
  generateFor(datatype) {
    var min = 0;
    var max = 100;
    switch (datatype) {
      case 'memory':
        min = 120;
        max = 300;
        break;
      case 'cpu':
        min = 20;
        max = 80;
        break;
      case 'threads':
        min = 17;
        max = 150;
        break;
    }

    var t = Date.now() - 1000 * 60;
    const minute = Array(30).fill().map(e => {
      return {
        x: (() => { t = t + (2000); return t; })(),
        y: this.rand(min, max)
      }
    });
    t = Date.now() - 1000 * 60 * 60;
    const hour = Array(29).fill().map(e => {
      return {
        x: (() => { t = t + (1000 * 60 * 2); return t; })(),
        y: this.rand(min, max)
      }
    });
    t = Date.now() - 1000 * 60 * 60 * 24;
    const day = Array(23).fill().map(e => {
      return {
        x: (() => { t = t + (1000 * 60 * 60); return t; })(),
        y: this.rand(min, max)
      }
    });
    t = Date.now() - 1000 * 60 * 60 * 24 * 8
    const week = Array(7).fill().map(e => {
      return {
        x: (() => { t = t + (1000 * 60 * 60 * 24); return t; })(),
        y: this.rand(min, max)
      }
    });
    const initData = week.concat(day).concat(hour).concat(minute);
    this._dataCallback({ t: datatype, init: initData });
    this.timer = setInterval(() => this._dataCallback({
      t: datatype,
      x: Date.now(),
      y: this.rand(min, max)
    }), 2000);
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

export const SimulationGenerator = LtsGraphsSimulation;
