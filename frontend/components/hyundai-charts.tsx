import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer, ReferenceDot } from 'recharts';

const HyundaiCharts = () => {
  // 차트 1 데이터: 사건 영향 범위
  const impactData = [
    { stage: '배터리', impact: 85, description: '높은 영향도' },
    { stage: '조립', impact: 25, description: '낮은 영향도' },
    { stage: '물류', impact: 55, description: '중간 영향도' }
  ];

  // 차트 2 데이터: 현대차 주가 추이 (최근 6개월)
  const stockData = [
    { date: '2025-03', price: 168000, event: null },
    { date: '2025-04', price: 175000, event: 'IRA 인센티브 발표' },
    { date: '2025-04-15', price: 182000, event: null },
    { date: '2025-05', price: 178000, event: null },
    { date: '2025-06', price: 185000, event: '공장 건설 발표' },
    { date: '2025-06-15', price: 192000, event: null },
    { date: '2025-07', price: 188000, event: null },
    { date: '2025-08', price: 195000, event: null },
    { date: '2025-09', price: 172000, event: '이민단속 사건' },
    { date: '2025-09-25', price: 165000, event: null }
  ];

  const events = stockData.filter(item => item.event);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card text-foreground p-3 border border-border rounded-md shadow-md">
          <p className="font-semibold">{`날짜: ${label}`}</p>
          <p className="text-primary">{`주가: ${payload[0].value.toLocaleString()}원`}</p>
          {data.event && <p className="text-destructive font-medium">{`이벤트: ${data.event}`}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full p-4 bg-card my-4">
      <h2 className="text-xl font-bold text-center mb-2 text-foreground">
        현대차 사건 영향 분석
      </h2>
      
      {/* 차트 1: 사건 영향 범위 도식화 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-foreground">
          차트 1: 사건 영향 범위 도식화
        </h3>
        <div className="bg-card p-4 rounded-lg">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={impactData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="stage" 
                tick={{ fontSize: 14 }}
                label={{ value: '공정 단계', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                label={{ value: '영향 강도', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value: any, name: any) => [`${value}%`, '영향도']}
                labelFormatter={(label: any) => `공정 단계: ${label}`}
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  color: 'var(--foreground)',
                }}
              />
              <Bar 
                dataKey="impact" 
                fill="#B1CAFF"
                name="영향 강도"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-muted-foreground">
            <p><strong>분석:</strong> 배터리 공정에서 가장 높은 영향(85%), 물류 중간 영향(55%), 조립 공정 낮은 영향(25%)</p>
          </div>
        </div>
      </div>

      {/* 차트 2: 현대차 주가 vs 주요 이벤트 */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-foreground">
          차트 2: 현대차 주가 vs 주요 이벤트 (최근 6개월)
        </h3>
        <div className="bg-card p-4 rounded-lg">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stockData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, angle: -15, textAnchor: 'end' }}
                height={80}
                label={{ value: '날짜', position: 'insideBottom', offset: -2 }}
              />
              <YAxis 
                domain={['dataMin - 5000', 'dataMax + 5000']}
                tick={{ fontSize: 12 }}
                tickFormatter={(value: any) => `${(value/1000).toFixed(0)}K`}
                label={{ value: '주가 (원)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3A4D9B" 
                strokeWidth={3}
                dot={{ fill: '#3A4D9B', strokeWidth: 1.5, r: 4 }}
                activeDot={{ r: 6, stroke: '#3A4D9B', strokeWidth: 1 }}
              />
              
              {/* 이벤트 마커 */}
              {events.map((event, index) => (
                <ReferenceDot
                  key={index}
                  x={event.date}
                  y={event.price}
                  r={8}
                  fill="#83AA19"
                  stroke="#83AA19"
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          
          {/* 이벤트 범례 */}
          <div className="mt-1 p-3 bg-muted rounded">
            <h3 className="font-semibold mb-1 text-foreground">주요 이벤트</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: '#83AA19'}}></div>
                <span><strong>2025-04:</strong> IRA 인센티브 발표 (+7K원)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: '#83AA19'}}></div>
                <span><strong>2025-06:</strong> 공장 건설 발표 (+7K원)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: '#83AA19'}}></div>
                <span><strong>2025-09:</strong> 이민단속 사건 (-23K원)</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p><strong>분석:</strong> 긍정적 이벤트(IRA, 공장건설)는 주가 상승을 견인했으나, 이민단속 사건으로 인한 하락폭이 더 큼</p>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default HyundaiCharts;
