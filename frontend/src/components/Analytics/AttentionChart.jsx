import {
  Line
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale
);

export default function AttentionChart({ data }) {

  const chartData = {
    labels: data.map((_, i) => i + 1),
    datasets: [
      {
        label: "Attention Score",
        data,
        borderColor: "#3B82F6",
        backgroundColor: "#3B82F6",
        tension: 0.3
      }
    ]
  };

  return (
    <div className="bg-gray-900 p-6 rounded-2xl">
      <h2 className="text-xl font-bold mb-4">
        📊 Attention Performance
      </h2>
      <Line data={chartData} />
    </div>
  );
}