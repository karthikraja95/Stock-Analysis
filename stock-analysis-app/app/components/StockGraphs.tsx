'use client'

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { motion } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

interface StockGraphsProps {
  historicalData: any[];
}

const StockGraphs: React.FC<StockGraphsProps> = ({ historicalData }) => {
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (historicalData && historicalData.length > 0) {
      const formattedData = {
        labels: historicalData.map(data => new Date(data.date)),
        datasets: [
          {
            label: 'Close Price',
            data: historicalData.map(data => data.close),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y',
          },
          {
            label: 'Volume',
            data: historicalData.map(data => data.volume),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y1',
          }
        ]
      };
      setChartData(formattedData);
    }
  }, [historicalData]);

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
          unit: 'month' as const,
          displayFormats: {
            month: 'MMM yyyy'
          }
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
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Price',
          font: {
            size: 14,
            family: "'SF Pro Display', sans-serif",
            weight: 'bold'
          }
        },
        ticks: {
          font: {
            size: 12,
            family: "'SF Pro Display', sans-serif"
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Volume',
          font: {
            size: 14,
            family: "'SF Pro Display', sans-serif",
            weight: 'bold'
          }
        },
        ticks: {
          font: {
            size: 12,
            family: "'SF Pro Display', sans-serif"
          }
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 14,
            family: "'SF Pro Display', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#ccc',
        borderWidth: 1,
        cornerRadius: 6,
        titleFont: {
          size: 14,
          family: "'SF Pro Display', sans-serif",
          weight: 'bold'
        },
        bodyFont: {
          size: 12,
          family: "'SF Pro Display', sans-serif"
        },
      }
    }
  };

  if (!chartData) {
    return <div className="text-center text-gray-500">Loading chart data...</div>;
  }

  return (
    <div className="h-[400px] w-full">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default StockGraphs;