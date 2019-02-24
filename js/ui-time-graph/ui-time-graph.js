import Chart from './Chart.js';
import streamingPlugin from './streaming/streaming'

/**
 * Shows a graph for time-resources.
 */
class UITimeGraph extends HTMLElement {
  constructor() {
    super();
    var dom = this.attachShadow({ mode: 'open' });

    this.config = {
      dom: dom,
      plugins: [streamingPlugin],
      type: 'line',
      data: {
        datasets: [{
          streaming: { duration: 0, delay: 0 },
          label: '',
          backgroundColor: 0,
          borderColor: 0,
          data: [],
          fill: false,
        }, {
          streaming: { duration: 1000 * 60, delay: 2000 },
          label: 'Minute',
          backgroundColor: 0,
          borderColor: 0,
          data: [],
          fill: false,
        }, {
          streaming: { duration: 1000 * 60 * 60, delay: 1000 * 60 },
          label: 'Hour',
          backgroundColor: 0,
          borderColor: 0,
          data: [],
          fill: false,
        }, {
          streaming: { duration: 1000 * 60 * 60 * 24, delay: 1000 * 60 * 60 },
          label: 'Day',
          backgroundColor: 0,
          borderColor: 0,
          data: [],
          fill: false,
        }, {
          streaming: { duration: 1000 * 60 * 60 * 24 * 7, delay: 1000 * 60 * 60 * 24 },
          label: 'Week',
          backgroundColor: 0,
          borderColor: 0,
          data: [],
          fill: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          onClick: (e, legendItem) => this.show(e, legendItem),
          labels: {
            filter: function (item, chart) {
              return item.text != '';
            }
          }
        },
        tooltips: false,
        // events: [],
        title: {
          display: true,
          text: "",
        },
        elements: {
          line: {
            tension: 0
          }
        },
        hover: {
          mode: null
        },
        plugins: {
          streaming: {            // per-chart option
            frameRate: 30       // chart is drawn 30 times every second
          }
        },
        scales: {
          // xAxes: [{
          //     display: true,
          //     scaleLabel: {
          //         display: true,
          //         labelString: 'Month'
          //     },
          //     ticks: {
          //         min: 0,
          //         max: ERROR
          //     }
          // }],
          xAxes: [{
            type: 'realtime',
            realtime: {
              duration: 1000 * 60 * 60,
              delay: 1000,
              pause: false,
              ttl: 1000 * 60 * 60 * 24 * 8
            },
            gridLines: { display: false, drawBorder: false }
          }],
          yAxes: [{
            display: true,
            scaleLabel: false,
            ticks: {
              min: 0,
              suggestedMax: 100
            },
            gridLines: {
              display: true,
              color: 0,
              zeroLineColor: 0,
              drawBorder: false,
              drawTicks: false
            }
          }]
        }
      }
    };

    this.themeChangeBound = () => this.themeChange();
    this.resizeBound = () => {
      if (this.debounceResizeTimer) {
        clearTimeout(this.debounceResizeTimer);
        delete this.debounceResizeTimer;
      }
      this.debounceResizeTimer = setTimeout(() => this.charts.resize(), 200);
    }
  }
  connectedCallback() {
    document.addEventListener('themechanged', this.themeChangeBound, { passive: true });

    // try {
    //   this.maxdata = this.hasAttribute("maxdata") ? parseInt(this.getAttribute("maxdata")) : 20;
    // } catch (e) {
    //   this.maxdata = 20;
    // }

    this.config.options.title.text = this.hasAttribute("label") ? this.getAttribute("label") : 'My First dataset';

    const root = this.shadowRoot;
    root.innerHTML = `<style id="chartjs">
        :host {
            display: block;
            position: relative;
        }
        canvas{
            -moz-user-select: none;
            -webkit-user-select: none;
            -ms-user-select: none;
            background-color: var(--background-color);
        }
        * DOM element rendering detection
        * https://davidwalsh.name/detect-node-insertion
         */
        @keyframes chartjs-render-animation {
          from { opacity: 0.99; }
          to { opacity: 1; }
        }
        
        .chartjs-render-monitor {
          animation: chartjs-render-animation 0.001s;
        }
        
        /*
         * DOM element resizing detection
         * https://github.com/marcj/css-element-queries
         */
        .chartjs-size-monitor,
        .chartjs-size-monitor-expand,
        .chartjs-size-monitor-shrink {
          position: absolute;
          direction: ltr;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          pointer-events: none;
          visibility: hidden;
          z-index: -1;
        }
        
        .chartjs-size-monitor-expand > div {
          position: absolute;
          width: 1000000px;
          height: 1000000px;
          left: 0;
          top: 0;
        }
        
        .chartjs-size-monitor-shrink > div {
          position: absolute;
          width: 200%;
          height: 200%;
          left: 0;
          top: 0;
        }
        </style>`;

    const color = this.hasAttribute("color") ? this.getAttribute("color") : "rgb(255, 99, 132)";
    for (let dataset of this.config.data.datasets) {
      dataset.backgroundColor = color;
      dataset.borderColor = color;
    }
    this.applyColors();
    this.canvas = document.createElement("canvas");
    var ctx = this.canvas.getContext('2d');
    this.charts = new Chart(ctx, this.config);
    root.appendChild(this.canvas);
    this.show(null, { datasetIndex: 2 });
    this.charts.resize();
    this.ready = true;
    this.dispatchEvent(new Event("load"));

    window.addEventListener('resize', this.resizeBound, { passive: true });
  }
  disconnectedCallback() {
    if (this.debounceResizeTimer) {
      clearTimeout(this.debounceResizeTimer);
      delete this.debounceResizeTimer;
    }
    delete this.canvas;
    window.removeEventListener('resize', this.resizeBound, { passive: true });
    document.removeEventListener('themechanged', this.themeChangeBound, { passive: true });
  }
  themeChange() {
    window.requestAnimationFrame(() => {
      this.applyColors();
      this.charts.update();
    });
  }
  applyColors() {
    const fontColor = getComputedStyle(document.body).getPropertyValue('--color');
    //const gridLineColor = getComputedStyle(document.body).getPropertyValue('--border-btn');
    this.config.options.title.fontColor = fontColor;
    this.config.options.scales.yAxes[0].ticks.fontColor = fontColor;
    this.config.options.scales.yAxes[0].gridLines.color = fontColor;
    this.config.options.scales.yAxes[0].gridLines.zeroLineColor = fontColor;
    this.config.options.legend.labels.fontColor = fontColor;
    this.fontColor = fontColor;
  }
  show(e, legendItem) {
    for (var i = 1; i < this.config.data.datasets.length; ++i) {
      var dataset = this.config.data.datasets[i];
      dataset.backgroundColor = "lightgray";
      dataset.borderColor = this.fontColor;
      dataset.fontColor = this.fontColor;
    }
    var dataset = this.config.data.datasets[legendItem.datasetIndex];
    dataset.backgroundColor = 0;
    dataset.borderColor = 0;
    this.config.options.scales.xAxes[0].realtime.duration = dataset.streaming.duration;
    this.config.options.scales.xAxes[0].realtime.delay = dataset.streaming.delay;
    this.charts.update({ duration: 0 });
  }

  addData(value) {

    const dataset = this.config.data.datasets[0];
    dataset.data.push(value);
    this.charts.update();
  }

  initData(values) {
    const dataset = this.config.data.datasets[0];
    dataset.data = values;
    this.charts.update({ duration: 0 });
  }

}

customElements.define('ui-time-graph', UITimeGraph);