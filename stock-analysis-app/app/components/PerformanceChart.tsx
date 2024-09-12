'use client'

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { motion } from 'framer-motion';
import { eachDayOfInterval, isWeekend, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

interface PerformanceChartProps {
  historicalData: any[];
}

const timeRanges = ['1D', '1W', '1M', '3M', '6M'];

const PerformanceChart: React.FC<PerformanceChartProps> = ({ historicalData }) => {
  const [activeRange, setActiveRange] = useState('1M');
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (historicalData && historicalData.length > 0) {
      const filteredData = filterDataByRange(historicalData, activeRange);
      const formattedData = {
        labels: filteredData.map(data => new Date(data.date)),
        datasets: [{
          label: 'Price',
          data: filteredData.map(data => data.close),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        }]
      };
      setChartData(formattedData);
    }
  }, [historicalData, activeRange]);

  const filterDataByRange = (data: any[], range: string) => {
    const now = new Date();
    let startDate = new Date();
    let filteredData;

    switch (range) {
      case '1D':
        startDate = startOfDay(now);
        filteredData = data.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= startDate && itemDate <= now;
        });
        // If no data for today (e.g., market not open yet), use yesterday's data
        if (filteredData.length === 0) {
          startDate = startOfDay(subDays(now, 1));
          filteredData = data.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= startDate && itemDate < now;
          });
        }
        return filteredData;
      case '1W':
        startDate = subDays(now, 7);
        break;
      case '1M':
        startDate = subMonths(now, 1);
        break;
      case '3M':
        startDate = subMonths(now, 3);
        break;
      case '6M':
        startDate = subMonths(now, 6);
        break;
      default:
        startDate = subMonths(now, 1);
    }

    // Filter out weekends for ranges other than 1D
    if (range !== '1D') {
      return data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= now && !isWeekend(itemDate);
      });
    }

    return data.filter(item => new Date(item.date) >= startDate && new Date(item.date) <= now);
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: activeRange === '1D' ? 'hour' : 'day' as const,
          displayFormats: {
            hour: 'HH:mm',
            day: 'MMM d',
          },
        },
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            family: "'SF Pro Display', sans-serif"
          }
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          font: {
            size: 12,
            family: "'SF Pro Display', sans-serif"
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#ccc',
        borderWidth: 1,
        cornerRadius: 6,
        titleFont: {
          size: 14,
          family: "'SF Pro Display', sans-serif",
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 12,
          family: "'SF Pro Display', sans-serif"
        },
        callbacks: {
          title: (context: any) => {
            const date = new Date(context[0].parsed.x);
            return activeRange === '1D'
              ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
          }
        }
      },
    },
  };

  if (!chartData) {
    return <div className="text-center text-gray-500">Loading chart data...</div>;
  }

  return (
    <motion.div 
      className="card"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <h3 className="text-xl font-semibold mb-4">Performance</h3>
      <div className="flex justify-between mb-4">
        {timeRanges.map(range => (
          <button
            key={range}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeRange === range 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setActiveRange(range)}
          >
            {range}
          </button>
        ))}
      </div>
      <div className="h-[300px] w-full">
        <Line data={chartData} options={options} />
      </div>
    </motion.div>
  );
};

export default PerformanceChart;