import Chart from './chartsjs.js';
import streamingPlugin from './streaming/streaming'

/**
 * Shows a graph for time-resources.
 */
class UITimeGraph extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.waitForEvent = this.hasAttribute("waitForEvent") ? this.getAttribute("waitForEvent") : null;
        this.pageChangedBound = () => this.ready();
        if (this.waitForEvent) document.addEventListener(this.waitForEvent, this.pageChangedBound);

        try {
            this.maxdata = this.hasAttribute("maxdata") ? parseInt(this.getAttribute("maxdata")) : 20;
        } catch (e) {
            this.maxdata = 20;
        }

        this.color = this.hasAttribute("color") ? this.getAttribute("color") : "rgb(255, 99, 132)";

        this.config = {
            plugins: [streamingPlugin],
            type: 'line',
            data: {
                datasets: [{
                    streaming: { duration: 0, delay: 0 },
                    label: '',
                    backgroundColor: this.color,
                    borderColor: this.color,
                    data: [],
                    fill: false,
                },{
                    streaming: { duration: 1000 * 60, delay: 2000 },
                    label: 'Minute',
                    backgroundColor: this.color,
                    borderColor: this.color,
                    data: [],
                    fill: false,
                }, {
                    streaming: { duration: 1000 * 60 * 60, delay: 1000 * 60 },
                    label: 'Hour',
                    backgroundColor: this.color,
                    borderColor: this.color,
                    data: [],
                    fill: false,
                }, {
                    streaming: { duration: 1000 * 60 * 60 * 24, delay: 1000 * 60 * 60 },
                    label: 'Day',
                    backgroundColor: this.color,
                    borderColor: this.color,
                    data: [],
                    fill: false,
                }, {
                    streaming: { duration: 1000 * 60 * 60 * 24 * 7, delay: 1000 * 60 * 60 * 24 },
                    label: 'Week',
                    backgroundColor: this.color,
                    borderColor: this.color,
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
                        filter: function(item, chart) {
                            return item.text!='';
                        }
                    }
                },
                tooltips: false,
                // events: [],
                title: {
                    display: true,
                    text: this.hasAttribute("label") ? this.getAttribute("label") : 'My First dataset',
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
                    //         max: this.maxdata
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
                    }],
                    yAxes: [{
                        display: true,
                        scaleLabel: false,
                        ticks: {
                            min: 0,
                            suggestedMax: 100
                        }
                    }]
                }
            }
        };
    }
    disconnectedCallback() {
        this.canvas = null;
        if (this.waitForEvent) document.removeEventListener(this.waitForEvent, this.pageChangedBound);
    }
    connectedCallback() {
        const root = this.shadowRoot;
        root.innerHTML = `<style>
        :host {
            display: block;
            position: relative;
        }
        canvas{
            -moz-user-select: none;
            -webkit-user-select: none;
            -ms-user-select: none;
        }</style>`;
        // Private API use: ShadowDom style encapsulation workaround
        root.appendChild(Chart.platform._style.cloneNode(true));
        this.canvas = document.createElement("canvas");
        var ctx = this.canvas.getContext('2d');
        this.charts = new Chart(ctx, this.config);
        root.appendChild(this.canvas);
        // this.charts.resize();
        if (!this.waitForEvent) this.ready();
    }

    show(e, legendItem) {
        for (var i=1;i<this.config.data.datasets.length;++i) {
            var dataset = this.config.data.datasets[i];
            dataset.backgroundColor = "lightgray";
            dataset.borderColor = "lightgray";
        }
        var dataset = this.config.data.datasets[legendItem.datasetIndex];
        dataset.backgroundColor = this.color;
        dataset.borderColor = this.color;
        this.config.options.scales.xAxes[0].realtime.duration = dataset.streaming.duration;
        this.config.options.scales.xAxes[0].realtime.delay = dataset.streaming.delay;
        this.charts.update();
    }
    ready() {
        this.dispatchEvent(new Event("load"));
    }

    addData(value) {
        const dataset = this.config.data.datasets[0];
        dataset.data.push(value);
        this.charts.update({
            preservation: true
        });
    }

    initData(values) {
        const dataset = this.config.data.datasets[0];
        dataset.data = values;
        this.show(null, { datasetIndex: 2 });
    }

}

customElements.define('ui-time-graph', UITimeGraph);