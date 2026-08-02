'use client';

import React from 'react';
import { Tile, TileColor } from '../../types/okey';

interface TileComponentProps {
  tile: Tile;
  isSelected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function TileComponent({
  tile,
  isSelected = false,
  onClick,
  onDoubleClick,
  onDragStart,
  size = 'md',
}: TileComponentProps) {
  const getColorStyle = (color: TileColor) => {
    switch (color) {
      case 'red':
        return 'text-red-600';
      case 'black':
        return 'text-slate-900';
      case 'blue':
        return 'text-blue-600';
      case 'yellow':
        return 'text-amber-500';
      case 'fake':
      default:
        return 'text-purple-600';
    }
  };

  const dimensions = {
    sm: 'w-7 h-10 text-xs p-0.5',
    md: 'w-9 h-13 text-sm p-1',
    lg: 'w-11 h-16 text-base p-1.5',
  }[size];

  const numberFontSize = {
    sm: 'text-sm font-black',
    md: 'text-base font-black',
    lg: 'text-xl font-black',
  }[size];

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`okey-tile relative flex flex-col justify-between items-center cursor-pointer transition-all duration-150 select-none ${dimensions} ${
        isSelected ? 'okey-tile-selected' : 'hover:-translate-y-1 hover:shadow-lg'
      }`}
    >
      {/* Top corner color indicator dot */}
      <div className="w-full flex justify-between items-center text-[10px] leading-none">
        <span className={`font-bold ${getColorStyle(tile.color)}`}>
          {tile.isFake ? '★' : tile.number}
        </span>
        {tile.isOkey && (
          <span className="w-2 h-2 rounded-full bg-amber-400 border border-amber-600 animate-pulse" title="OKEY TAŞI" />
        )}
      </div>

      {/* Main Center Number */}
      <div className={`${numberFontSize} ${getColorStyle(tile.color)} text-center leading-none my-auto`}>
        {tile.isFake ? '★' : tile.number}
      </div>

      {/* Bottom corner symbol */}
      <div className="w-full text-right text-[10px] leading-none">
        <span className={`font-bold ${getColorStyle(tile.color)}`}>★</span>
      </div>
    </div>
  );
}
