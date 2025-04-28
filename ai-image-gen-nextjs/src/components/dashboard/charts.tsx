"use client"; // This component renders the charts on the client

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';

// Define the expected shape of the data prop
interface ChartDataPoint {
    name: string;
    generations?: number; // Optional for flexibility
    cost?: number;        // Optional
}

interface DashboardChartsProps {
    providerUsageData: ChartDataPoint[];
    modelUsageData: ChartDataPoint[];
    costData: ChartDataPoint[]; // Keep placeholder cost data for now
}

export function DashboardCharts({ providerUsageData, modelUsageData, costData }: DashboardChartsProps) {

    // Determine chart colors - this check runs on the client
    const isDarkMode = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const barFillColor = isDarkMode ? "#3b82f6" : "#60a5fa";
    const lineColor = isDarkMode ? "#a78bfa" : "#c084fc";
    const axisColor = isDarkMode ? "#9ca3af" : "#6b7280";

    return (
        <>
            {/* Provider Usage Chart */}
            <div className="h-[300px] w-full p-0 pr-4 pb-4">
                {providerUsageData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={providerUsageData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={axisColor + '40'} />
                            <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: axisColor + '20' }}
                                contentStyle={{ backgroundColor: isDarkMode ? '#020817' : '#ffffff', border: `1px solid ${axisColor + '40'}`, borderRadius: '0.5rem' }}
                                labelStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
                            />
                            <Bar dataKey="generations" fill={barFillColor} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        No provider usage data yet.
                    </div>
                )}
            </div>

            {/* Model Usage Chart */}
            <div className="h-[300px] w-full p-0 pr-4 pb-4">
                {modelUsageData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={modelUsageData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={axisColor + '40'} />
                            <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={50} />
                            <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: axisColor + '20' }}
                                contentStyle={{ backgroundColor: isDarkMode ? '#020817' : '#ffffff', border: `1px solid ${axisColor + '40'}`, borderRadius: '0.5rem' }}
                                labelStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
                            />
                            <Bar dataKey="generations" fill={barFillColor} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        No model usage data yet.
                    </div>
                )}
            </div>

            {/* Cost Tracking Chart - Placeholder */}
             <div className="h-[200px] w-full p-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={costData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={axisColor + '40'}/>
                        <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false}/>
                        <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false}/>
                         <Tooltip
                            cursor={{ stroke: axisColor + '40' }}
                            contentStyle={{ backgroundColor: isDarkMode ? '#020817' : '#ffffff', border: `1px solid ${axisColor+'40'}`, borderRadius: '0.5rem' }}
                            labelStyle={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }}
                        />
                        <Line type="monotone" dataKey="cost" stroke={lineColor} strokeWidth={2} dot={false} activeDot={{ r: 6 }}/>
                    </LineChart>
                 </ResponsiveContainer>
             </div>
        </>
    );
} 