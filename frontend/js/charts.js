/**
 * CITYSYNC - Chart.js Visualizations Controller
 * High-performance dark themed charts for real-time telemetry,
 * historical trends, infrastructure health, and ML confidence intervals.
 */
class ChartsController {
  constructor() {
    this.charts = {};
  }

  getCommonOptions(title = '', yLabel = '') {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#9CA3AF', font: { family: 'Inter', size: 11 } } },
        tooltip: {
          backgroundColor: '#1E293B',
          titleColor: '#F3F4F6',
          bodyColor: '#9CA3AF',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#6B7280', font: { size: 10 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.04)' },
          ticks: { color: '#6B7280', font: { size: 10 } },
          title: yLabel ? { display: true, text: yLabel, color: '#9CA3AF', font: { size: 11 } } : undefined
        }
      }
    };
  }

  // 1. Overview Traffic Chart
  initOverviewTrafficChart(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    this.charts.overviewTraffic = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Congestion Level (%)',
          data: [],
          borderColor: '#06B6D4',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 2
        }]
      },
      options: this.getCommonOptions('Traffic Congestion Trend', 'Congestion %')
    });
  }

  // 2. Overview Electricity Chart
  initOverviewElectricityChart(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    this.charts.overviewElectricity = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Power Demand (MW)',
          data: [],
          borderColor: '#EAB308',
          backgroundColor: 'rgba(234, 179, 8, 0.12)',
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 2
        }]
      },
      options: this.getCommonOptions('Grid Power Demand', 'Megawatts (MW)')
    });
  }

  // 3. Overview Water Chart
  initOverviewWaterChart(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    this.charts.overviewWater = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Mains Water Pressure (PSI)',
          data: [],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 2
        }]
      },
      options: this.getCommonOptions('Water System Pressure', 'PSI')
    });
  }

  // 4. ML Traffic Prediction with 90% Confidence Envelope
  initMLTrafficChart(canvasId, comparisonData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const labels = comparisonData.map(d => `Sample ${d.sample_index}`);
    const actuals = comparisonData.map(d => d.actual);
    const predicted = comparisonData.map(d => d.predicted);
    const upperBounds = comparisonData.map(d => d.upper_bound);
    const lowerBounds = comparisonData.map(d => d.lower_bound);

    if (this.charts.mlTraffic) this.charts.mlTraffic.destroy();

    this.charts.mlTraffic = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Actual Congestion (%)',
            data: actuals,
            borderColor: '#10B981',
            backgroundColor: '#10B981',
            pointRadius: 4,
            borderWidth: 2
          },
          {
            label: 'RF Predicted (%)',
            data: predicted,
            borderColor: '#06B6D4',
            borderDash: [5, 5],
            pointRadius: 3,
            borderWidth: 2
          },
          {
            label: '90% Upper Bound',
            data: upperBounds,
            borderColor: 'rgba(6, 182, 212, 0.3)',
            fill: '+1',
            backgroundColor: 'rgba(6, 182, 212, 0.08)',
            pointRadius: 0,
            borderWidth: 1
          },
          {
            label: '90% Lower Bound',
            data: lowerBounds,
            borderColor: 'rgba(6, 182, 212, 0.3)',
            fill: false,
            pointRadius: 0,
            borderWidth: 1
          }
        ]
      },
      options: this.getCommonOptions('Actual vs Random Forest Prediction', 'Congestion %')
    });
  }

  // 5. ML Electricity Prediction with 90% Confidence Envelope
  initMLElectricityChart(canvasId, comparisonData) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const labels = comparisonData.map(d => `Sample ${d.sample_index}`);
    const actuals = comparisonData.map(d => d.actual);
    const predicted = comparisonData.map(d => d.predicted);

    if (this.charts.mlElectricity) this.charts.mlElectricity.destroy();

    this.charts.mlElectricity = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Actual Demand (MW)',
            data: actuals,
            borderColor: '#EAB308',
            pointRadius: 4,
            borderWidth: 2
          },
          {
            label: 'RF Predicted Demand (MW)',
            data: predicted,
            borderColor: '#A855F7',
            borderDash: [5, 5],
            pointRadius: 3,
            borderWidth: 2
          }
        ]
      },
      options: this.getCommonOptions('Power Demand: Actual vs Forecast', 'Demand (MW)')
    });
  }

  // 6. Traffic Intelligence Detail Analytics Chart
  initTrafficDetailChart(canvasId, trends) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.charts.trafficDetail) this.charts.trafficDetail.destroy();

    const labels = trends.labels || [];
    const congestion = trends.congestion_levels || [];
    const speeds = trends.average_speeds || [];

    this.charts.trafficDetail = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Corridor Congestion (%)',
            data: congestion,
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.35,
            yAxisID: 'y'
          },
          {
            label: 'Average Speed (km/h)',
            data: speeds,
            borderColor: '#06B6D4',
            borderWidth: 2,
            tension: 0.35,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        ...this.getCommonOptions('Traffic Telemetry Trends', 'Congestion %'),
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#6B7280', font: { size: 10 } }
          },
          y: {
            position: 'left',
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#EF4444', font: { size: 10 } },
            title: { display: true, text: 'Congestion %', color: '#EF4444' }
          },
          y1: {
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#06B6D4', font: { size: 10 } },
            title: { display: true, text: 'Speed (km/h)', color: '#06B6D4' }
          }
        }
      }
    });
  }

  // 7. Energy Intelligence Detail Analytics Chart
  initEnergyDetailChart(canvasId, trends) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.charts.energyDetail) this.charts.energyDetail.destroy();

    const labels = trends.labels || [];
    const demands = trends.power_demands || [];
    const temps = trends.temperatures || [];

    this.charts.energyDetail = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Grid Power Demand (MW)',
            data: demands,
            borderColor: '#EAB308',
            backgroundColor: 'rgba(234, 179, 8, 0.12)',
            borderWidth: 2,
            fill: true,
            tension: 0.35,
            yAxisID: 'y'
          },
          {
            label: 'Transformer Core Temp (°C)',
            data: temps,
            borderColor: '#F97316',
            borderWidth: 2,
            tension: 0.35,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        ...this.getCommonOptions('Electrical Grid Demand & Thermal Profile', 'Demand (MW)'),
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#6B7280', font: { size: 10 } }
          },
          y: {
            position: 'left',
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#EAB308', font: { size: 10 } },
            title: { display: true, text: 'Power (MW)', color: '#EAB308' }
          },
          y1: {
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#F97316', font: { size: 10 } },
            title: { display: true, text: 'Temp (°C)', color: '#F97316' }
          }
        }
      }
    });
  }

  // 8. Water Intelligence Detail Analytics Chart
  initWaterDetailChart(canvasId, trends) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    if (this.charts.waterDetail) this.charts.waterDetail.destroy();

    const labels = trends.labels || [];
    const pressures = trends.pressures || [];
    const flows = trends.flows || [];

    this.charts.waterDetail = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Mains Pressure (PSI)',
            data: pressures,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.35,
            yAxisID: 'y'
          },
          {
            label: 'Discharge Flow (L/s)',
            data: flows,
            borderColor: '#10B981',
            borderWidth: 2,
            tension: 0.35,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        ...this.getCommonOptions('Municipal Water Hydraulics', 'Pressure (PSI)'),
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#6B7280', font: { size: 10 } }
          },
          y: {
            position: 'left',
            grid: { color: 'rgba(255, 255, 255, 0.04)' },
            ticks: { color: '#3B82F6', font: { size: 10 } },
            title: { display: true, text: 'Pressure (PSI)', color: '#3B82F6' }
          },
          y1: {
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#10B981', font: { size: 10 } },
            title: { display: true, text: 'Flow (L/s)', color: '#10B981' }
          }
        }
      }
    });
  }

  updateTrend(chartKey, label, value) {
    const chart = this.charts[chartKey];
    if (!chart) return;
    if (chart.data.labels.length > 20) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
    }
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(value);
    chart.update('none'); // Fast update without animation hitch
  }
}

const charts = new ChartsController();
