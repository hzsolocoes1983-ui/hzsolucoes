import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@ui/card';
import { Button } from '@ui/button';

export function GoalCircle({ goal }: { goal: any }) {
  const data = [
    { value: goal.currentAmount },
    { value: goal.targetAmount - goal.currentAmount }
  ];
  const progress = ((goal.currentAmount / goal.targetAmount) * 100).toFixed(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{goal.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie data={data} cx={60} cy={60} innerRadius={40} outerRadius={55} dataKey="value">
              <Cell fill="#3b82f6" />
              <Cell fill="#e5e7eb" />
            </Pie>
            <text x={60} y={60} textAnchor="middle" dominantBaseline="middle" className="text-xl font-bold">
              {progress}%
            </text>
          </PieChart>
        </ResponsiveContainer>
        <p className="mt-2 text-sm">
          R$ {goal.currentAmount / 100} de R$ {goal.targetAmount / 100}
        </p>
      </CardContent>
    </Card>
  );
}