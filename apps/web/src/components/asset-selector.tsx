'use client';

import { SUPPORTED_ASSETS, type Asset } from '@/lib/assets';

interface AssetSelectorProps {
  value: string;
  onChange: (asset: Asset) => void;
  disabled?: boolean;
}

export function AssetSelector({ value, onChange, disabled }: AssetSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = SUPPORTED_ASSETS.find((a) => a.symbol === e.target.value);
    if (selected) {
      onChange(selected);
    }
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {SUPPORTED_ASSETS.map((asset) => (
        <option key={asset.symbol} value={asset.symbol}>
          {asset.symbol} - {asset.name}
        </option>
      ))}
    </select>
  );
}
