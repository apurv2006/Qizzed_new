import React from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function CorrectnessBar({ labels, dataPoints }){
  const data = {
    labels,
    datasets: [
      {
        label: 'Percent correct',
        data: dataPoints,
        borderRadius: 6,
        barThickness: 24
      }
    ]
  }
  const options = {
    responsive: true,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: { y: { beginAtZero: true, max:100 } }
  }
  return <div style={{maxWidth:640}}><Bar data={data} options={options} /></div>
}
