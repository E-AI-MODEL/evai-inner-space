
import React from 'react';
import { Message } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { TrendingUp, Users, MessageSquare, Brain, AlertTriangle } from 'lucide-react';

interface AdminAnalyticsProps {
  messages: Message[];
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ messages }) => {
  // Analytics calculations
  const totalMessages = messages.length;
  const userMessages = messages.filter(m => m.from === 'user').length;
  const aiMessages = messages.filter(m => m.from === 'ai').length;
  const emotionDetections = messages.filter(m => m.emotionSeed).length;

  // Label distribution
  const labelStats = messages
    .filter(m => m.from === 'ai' && m.label)
    .reduce((acc, msg) => {
      const label = msg.label!;
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const labelChartData = Object.entries(labelStats).map(([label, count]) => ({
    name: label,
    value: count
  }));

  // Emotion frequency
  const emotionStats = messages
    .filter(m => m.emotionSeed)
    .reduce((acc, msg) => {
      const emotion = msg.emotionSeed!;
      acc[emotion] = (acc[emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const emotionChartData = Object.entries(emotionStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([emotion, count]) => ({
      emotion,
      count
    }));

  // Feedback analysis
  const feedbackStats = messages.filter(m => m.feedback).reduce((acc, msg) => {
    acc[msg.feedback!] = (acc[msg.feedback!] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Time-based activity (simplified)
  const activityData = messages.slice(-24).map((msg, index) => ({
    time: `T${index + 1}`,
    messages: 1
  }));

  // Symbolic inferences statistics
  const symbolicStats = messages.reduce(
    (acc, msg) => {
      if (msg.symbolicInferences && msg.symbolicInferences.length) {
        acc.messageCount++;
        acc.total += msg.symbolicInferences.length;
        msg.symbolicInferences.forEach(inf => {
          acc.inferences[inf] = (acc.inferences[inf] || 0) + 1;
          if (/openai|neurosymbol/i.test(inf)) {
            acc.secondary++;
          }
        });
      }
      return acc;
    },
    { messageCount: 0, total: 0, secondary: 0, inferences: {} as Record<string, number> }
  );

  const topInferences = Object.entries(symbolicStats.inferences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  const chartConfig = {
    count: { label: "Aantal", color: "#3b82f6" },
    value: { label: "Waarde", color: "#10b981" }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Totaal Berichten</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{totalMessages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-green-500" />
              <span className="text-sm font-medium text-gray-700">Gebruiker Input</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{userMessages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Brain size={20} className="text-purple-500" />
              <span className="text-sm font-medium text-gray-700">AI Responses</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{aiMessages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-orange-500" />
              <span className="text-sm font-medium text-gray-700">Emotie Detecties</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{emotionDetections}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotion Frequency */}
        <Card>
          <CardHeader>
            <CardTitle>Top Emoties</CardTitle>
            <CardDescription>Meest gedetecteerde emoties</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emotionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="emotion" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill={chartConfig.count.color} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Label Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Response Labels</CardTitle>
            <CardDescription>Verdeling van AI response types</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={labelChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {labelChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Activiteit Timeline</CardTitle>
            <CardDescription>Recente berichtenactiviteit</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="messages" stroke={chartConfig.count.color} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Feedback Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>User Feedback</CardTitle>
            <CardDescription>Like/Dislike ratio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(feedbackStats).map(([feedback, count]) => (
                <div key={feedback} className="flex items-center justify-between">
                  <span className="font-medium capitalize">{feedback}s</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      feedback === 'like' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {count}
                    </div>
                  </div>
                </div>
              ))}
              {Object.keys(feedbackStats).length === 0 && (
                <p className="text-gray-500 text-center">Nog geen feedback ontvangen</p>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Symbolic Inferences Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Symbolic Inferences</CardTitle>
            <CardDescription>Analyse van opgeslagen observaties</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                {symbolicStats.messageCount} berichten bevatten{' '}
                {symbolicStats.total} symbolische observaties.
              </p>
              <p>
                {symbolicStats.secondary} afkomstig van de tweede API.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                {topInferences.map(([inf, count]) => (
                  <li key={inf}>
                    {inf} ({count}x)
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
