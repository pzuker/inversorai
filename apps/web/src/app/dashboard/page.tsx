'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchMarketData, triggerIngest } from '@/lib/apiClient';

const ADMIN_EMAIL = 'admin@inversorai.com';

interface MarketDataPoint {
  assetSymbol: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default function DashboardPage() {
  const { user, session, loading, signOut } = useAuth();
  const router = useRouter();

  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [ingestResult, setIngestResult] = useState<{ ingestedCount: number; persistedCount: number } | null>(null);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestError, setIngestError] = useState<string | null>(null);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  useEffect(() => {
    if (session?.access_token) {
      loadMarketData();
    }
  }, [session]);

  const loadMarketData = async () => {
    if (!session?.access_token) return;

    setDataLoading(true);
    setDataError(null);

    try {
      const data = await fetchMarketData(session.access_token);
      setMarketData(data);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setDataLoading(false);
    }
  };

  const handleIngest = async () => {
    if (!session?.access_token) return;

    setIngestLoading(true);
    setIngestError(null);
    setIngestResult(null);

    try {
      const result = await triggerIngest(session.access_token);
      setIngestResult(result);
      await loadMarketData();
    } catch (err) {
      setIngestError(err instanceof Error ? err.message : 'Failed to ingest');
    } finally {
      setIngestLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>InversorAI Dashboard</h1>
          <p>Logged in as: {user?.email}</p>
          {isAdmin && <span style={{ color: 'green', fontWeight: 'bold' }}>[ADMIN]</span>}
        </div>
        <button onClick={handleLogout} style={{ padding: '0.5rem 1rem' }}>
          Logout
        </button>
      </header>

      {isAdmin && (
        <section style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ccc' }}>
          <h2>Admin Actions</h2>
          <button
            onClick={handleIngest}
            disabled={ingestLoading}
            style={{ padding: '0.5rem 1rem', marginRight: '1rem' }}
          >
            {ingestLoading ? 'Updating...' : 'Actualizar datos'}
          </button>
          {ingestResult && (
            <span style={{ color: 'green' }}>
              Ingested: {ingestResult.ingestedCount}, Persisted: {ingestResult.persistedCount}
            </span>
          )}
          {ingestError && <span style={{ color: 'red' }}>{ingestError}</span>}
        </section>
      )}

      <section>
        <h2>Market Data (BTC-USD)</h2>
        <button onClick={loadMarketData} disabled={dataLoading} style={{ marginBottom: '1rem' }}>
          {dataLoading ? 'Loading...' : 'Refresh'}
        </button>

        {dataError && <p style={{ color: 'red' }}>{dataError}</p>}

        {marketData.length === 0 && !dataLoading && !dataError && (
          <p>No data available. {isAdmin && 'Click "Actualizar datos" to ingest data.'}</p>
        )}

        {marketData.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #333' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Timestamp</th>
                <th style={{ textAlign: 'right', padding: '0.5rem' }}>Open</th>
                <th style={{ textAlign: 'right', padding: '0.5rem' }}>High</th>
                <th style={{ textAlign: 'right', padding: '0.5rem' }}>Low</th>
                <th style={{ textAlign: 'right', padding: '0.5rem' }}>Close</th>
                <th style={{ textAlign: 'right', padding: '0.5rem' }}>Volume</th>
              </tr>
            </thead>
            <tbody>
              {marketData.map((point, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '0.5rem' }}>{new Date(point.timestamp).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right', padding: '0.5rem' }}>{point.open.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '0.5rem' }}>{point.high.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '0.5rem' }}>{point.low.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '0.5rem' }}>{point.close.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', padding: '0.5rem' }}>{point.volume.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
