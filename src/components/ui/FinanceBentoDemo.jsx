import React, { useEffect, useState } from 'react';
import { FinanceBento } from './finance-bento.tsx';

/* Geist + Geist Mono font loader for the bento */
function useFonts() {
  useEffect(() => {
    const id = "geist-fonts";
    if (document.getElementById(id)) return;
    const l = document.createElement("link");
    l.id = id;
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Geist:wght@200;300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap";
    document.head.appendChild(l);
  }, []);
}

/* 36 month-end balances that grow with some honest wobble */
const financeHistory = Array.from({ length: 36 }, (_, i) => {
  const t = i / 35;
  const d = new Date(2026, 9 - (35 - i), 1);
  const noise = (Math.sin(i * 12.9898 + 156.466) * 43758.5453) % 1;
  return {
    date: d.toISOString(),
    fiat: 14000 + t * 7000 + Math.sin(i * 0.9) * 900,
    stocks: 12000 + t * 19000 + Math.sin(i * 0.55) * 1600 + noise * 800,
    crypto: Math.max(
      2500,
      4000 + t * 12000 + Math.sin(i * 0.8 + 1) * 3200 + Math.cos(i * 0.33) * 1400
    ),
  };
});

const defaultFinanceData = {
  history: financeHistory,
  payments: [
    { name: "Rent & Studio", date: "Nov 1", amount: 1800 },
    { name: "Index fund · auto-buy", date: "Nov 3", amount: 500 },
    { name: "Server & Cloud Hosting", date: "Nov 9", amount: 120 },
  ],
  goals: [
    { name: "Emergency reserve", progress: 0.88, target: 25000 },
    { name: "Hardware workstation upgrade", progress: 0.64, target: 4500 },
  ],
  cashflow: {
    months: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
    income: [
      [5.4, 5.8, 5.2, 6.1, 6.8, 6.4],
      [4.8, 5.0, 4.9, 5.2, 5.6, 5.3],
      [4.2, 4.4, 4.5, 4.8, 4.9, 5.0],
    ],
    spending: [
      [3.2, 3.0, 3.5, 3.1, 3.4, 3.1],
      [2.9, 3.1, 2.8, 3.0, 3.1, 2.9],
      [2.6, 2.7, 2.5, 2.8, 2.7, 2.6],
    ],
  },
  crypto: [
    {
      name: "Bitcoin",
      symbol: "BTC",
      share: 0.62,
      change: "+3.8%",
      ohlc: [
        [64200, 65800, 63900, 65400],
        [65400, 66700, 64900, 66200],
        [66200, 67400, 65800, 67100],
        [67100, 68500, 66800, 68200],
        [68200, 69100, 67900, 68800],
        [68800, 70200, 68400, 69800],
        [69800, 71500, 69500, 71200],
      ],
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      share: 0.28,
      change: "+1.9%",
      ohlc: [
        [3200, 3320, 3180, 3290],
        [3290, 3360, 3250, 3340],
        [3340, 3420, 3310, 3390],
        [3390, 3450, 3370, 3430],
        [3430, 3510, 3410, 3480],
        [3480, 3560, 3460, 3520],
        [3520, 3620, 3500, 3590],
      ],
    },
    {
      name: "Solana",
      symbol: "SOL",
      share: 0.10,
      change: "-0.4%",
      ohlc: [
        [168, 175, 166, 172],
        [172, 178, 170, 176],
        [176, 182, 174, 180],
        [180, 184, 177, 181],
        [181, 186, 179, 183],
        [183, 188, 181, 185],
        [185, 187, 182, 184],
      ],
    },
  ],
  stocks: {
    days: ["M", "T", "W", "T", "F"],
    values: [3.4, 4.6, 2.9, 4.2, 3.8],
  },
};

const AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces";

export function FinanceBentoDemo() {
  useFonts();
  const [data] = useState(defaultFinanceData);

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#fff',
      padding: '24px 20px',
      overflowX: 'hidden',
    }}>
      <div style={{
        maxWidth: 1320,
        margin: '0 auto',
      }}>
        {/* Top Info Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 18px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#E8FF1F',
              boxShadow: '0 0 10px #E8FF1F',
            }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
              Finance Bento Component (21st.dev / Roman Vasnev)
            </span>
            <span style={{
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 20,
              backgroundColor: 'rgba(232, 255, 31, 0.15)',
              color: '#E8FF1F',
              fontFamily: 'Geist Mono, monospace',
              fontWeight: 600,
            }}>
              @/components/ui/finance-bento
            </span>
          </div>

          <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' }}>
            Zero charting dependencies • Pure SVG + DOM engine • Dark Mode Bento
          </div>
        </div>

        {/* The Bento Component */}
        <FinanceBento
          className="mx-auto"
          data={data}
          title="Overview"
          subtitle="Live financial analytics"
          avatar={AVATAR}
          avatarAlt="Finance User"
          credit={true}
        />
      </div>
    </div>
  );
}

export default FinanceBentoDemo;

