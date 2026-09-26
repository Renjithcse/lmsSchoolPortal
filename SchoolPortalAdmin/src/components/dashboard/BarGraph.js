import { BarChart } from "@mui/x-charts";

export default function BarGraph() {
    return (
        <BarChart
            series={[
                { data: [35, 44, 24, 34, 15], color: '#000' },
                { data: [51, 6, 49, 30, 25], color: 'red' },
                { data: [15, 25, 30, 50, 20] },
                { data: [60, 50, 15, 25, 30] },
                { data: [60, 50, 15, 25, 30] },
            ]}
            height={290}
            xAxis={[{ data: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'], scaleType: 'band' }]}
            margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
        />
    );
}