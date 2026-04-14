import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'A', value: 400 },
    { name: 'B', value: 300 },
    { name: 'C', value: 600 },
    { name: 'D', value: 200 },
    { name: 'E', value: 500 },
];

export const BarChartComponent: React.FC<{ config: any }> = ({ config }) => {
    return (
        <div className="w-full h-64 bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg rounded-xl p-4">
            <div className="text-sm font-bold text-slate-700 mb-2">{config.title}</div>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={config.color} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
