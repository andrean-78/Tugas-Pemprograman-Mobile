import React from 'react';
import { ChevronLeft, Circle, Maximize2, Minimize2, Signal, Square, Wifi } from 'lucide-react';

export type DeviceOs = 'ios' | 'android';

interface DeviceFrameProps {
  os: DeviceOs;
  onChangeOs: (os: DeviceOs) => void;
  isFullScreen?: boolean;
  isStandalone?: boolean;
  onToggleFullScreen?: () => void;
  onSystemBack?: () => void;
  onSystemHome?: () => void;
  onSystemOverview?: () => void;
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  os,
  onChangeOs,
  isFullScreen = false,
  isStandalone = false,
  onToggleFullScreen,
  onSystemBack,
  onSystemHome,
  onSystemOverview,
  children,
}) => {
  const isIos = os === 'ios';

  if (isFullScreen || isStandalone) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-white text-slate-900">
        {!isStandalone && onToggleFullScreen && (
          <div className="flex items-center justify-between border-b border-slate-200 bg-[#0A1628] px-3 py-1.5 text-[11px] text-slate-200 shrink-0">
            <span className="font-semibold">SiFasKampus · Mode Mobile Penuh</span>
            <button
              type="button"
              onClick={onToggleFullScreen}
              className="whitespace-nowrap shrink-0 inline-flex items-center gap-1 rounded-full border border-slate-600 bg-[#10203A] px-2.5 py-0.5 font-semibold text-blue-300 hover:border-blue-400"
            >
              <Minimize2 className="h-3 w-3" />
              <span>Bingkai HP</span>
            </button>
          </div>
        )}
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* OS Preview Switcher */}
      <div className="mb-3 flex items-center gap-1 rounded-full border border-slate-700/80 bg-[#10203A] p-1">
        <button
          type="button"
          onClick={() => onChangeOs('ios')}
          className={`whitespace-nowrap shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            isIos
              ? 'bg-[#1D5CE5] text-white shadow-xs'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          iPhone (iOS)
        </button>
        <button
          type="button"
          onClick={() => onChangeOs('android')}
          className={`whitespace-nowrap shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            !isIos
              ? 'bg-[#1D5CE5] text-white shadow-xs'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          Android OS
        </button>
        {onToggleFullScreen && (
          <button
            type="button"
            onClick={onToggleFullScreen}
            title="Mode Layar Penuh untuk HP"
            className="whitespace-nowrap shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <Maximize2 className="h-3 w-3" />
            <span>Penuh</span>
          </button>
        )}
      </div>

      {/* Physical Device Frame */}
      <div className="relative">
        {/* Hardware Side Buttons */}
        {isIos ? (
          <>
            {/* iPhone Action / Volume Buttons (Left) */}
            <span
              aria-hidden="true"
              className="hidden sm:block absolute -left-[3px] top-24 h-6 w-[3px] rounded-l bg-slate-600"
            />
            <span
              aria-hidden="true"
              className="hidden sm:block absolute -left-[3px] top-34 h-11 w-[3px] rounded-l bg-slate-600"
            />
            <span
              aria-hidden="true"
              className="hidden sm:block absolute -left-[3px] top-48 h-11 w-[3px] rounded-l bg-slate-600"
            />
            {/* iPhone Power Button (Right) */}
            <span
              aria-hidden="true"
              className="hidden sm:block absolute -right-[3px] top-36 h-16 w-[3px] rounded-r bg-slate-600"
            />
          </>
        ) : (
          <>
            {/* Android Volume & Power Buttons (Right) */}
            <span
              aria-hidden="true"
              className="hidden sm:block absolute -right-[3px] top-28 h-14 w-[3px] rounded-r bg-slate-600"
            />
            <span
              aria-hidden="true"
              className="hidden sm:block absolute -right-[3px] top-46 h-9 w-[3px] rounded-r bg-slate-600"
            />
          </>
        )}

        {/* Outer Chassis */}
        <div
          className={`flex flex-col overflow-hidden bg-black p-[9px] shadow-[0_24px_70px_rgba(0,0,0,0.65)] ring-1 ring-slate-600/70 transition-all duration-200 ${
            isIos
              ? 'rounded-[50px] w-[375px] max-w-[94vw] h-[740px] max-h-[calc(100dvh-6.5rem)] min-h-[260px]'
              : 'rounded-[36px] w-[375px] max-w-[94vw] h-[740px] max-h-[calc(100dvh-6.5rem)] min-h-[260px]'
          }`}
        >
          {/* Inner Screen Glass */}
          <div
            className={`flex flex-1 min-h-0 flex-col overflow-hidden bg-white text-slate-900 ${
              isIos ? 'rounded-[41px]' : 'rounded-[27px]'
            }`}
          >
            {/* OS Top Status Bar */}
            {isIos ? (
              <div className="relative flex items-center justify-between bg-white px-6 pb-2 pt-3 text-[11px] font-bold text-slate-900 select-none shrink-0">
                <span className="font-mono tabular-nums">09:41</span>
                {/* iPhone Dynamic Island */}
                <div
                  aria-hidden="true"
                  className="absolute left-1/2 top-2.5 flex h-[22px] w-[88px] -translate-x-1/2 items-center justify-end rounded-full bg-black px-2"
                >
                  <span className="h-2 w-2 rounded-full bg-slate-800 ring-1 ring-slate-700" />
                </div>
                <div className="flex items-center gap-1.5 text-slate-900">
                  <Signal className="h-3.5 w-3.5" />
                  <Wifi className="h-3.5 w-3.5" />
                  <div className="flex items-center gap-0.5">
                    <span className="flex h-2.5 w-5 items-center rounded-[3px] border border-slate-900 p-[1px]">
                      <span className="h-full w-full rounded-[1px] bg-slate-900" />
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative flex items-center justify-between bg-white px-5 pb-2 pt-2.5 text-[11px] font-semibold text-slate-800 select-none shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono tabular-nums">09:41</span>
                </div>
                {/* Android Punch-Hole Front Camera */}
                <div
                  aria-hidden="true"
                  className="absolute left-1/2 top-2.5 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-slate-950 ring-2 ring-slate-300"
                />
                <div className="flex items-center gap-1.5 text-slate-800">
                  <span className="font-mono text-[10px] font-bold">5G</span>
                  <Signal className="h-3.5 w-3.5" />
                  <Wifi className="h-3.5 w-3.5" />
                  <span className="font-mono text-[10px] tabular-nums">100%</span>
                </div>
              </div>
            )}

            {/* Main App Content */}
            <div className="flex flex-1 min-h-0 flex-col overflow-hidden">{children}</div>

            {/* OS Bottom System Bar */}
            {isIos ? (
              <div className="flex items-center justify-center bg-white pb-2 pt-1.5 shrink-0">
                <button
                  type="button"
                  onClick={onSystemHome}
                  title="iOS Home Bar"
                  aria-label="Kembali ke Home"
                  className="h-1 w-28 rounded-full bg-slate-900/85 transition-opacity hover:opacity-70"
                />
              </div>
            ) : (
              <div className="grid grid-cols-3 items-center border-t border-slate-100 bg-slate-50 py-2 text-slate-600 shrink-0">
                <button
                  type="button"
                  onClick={onSystemBack}
                  aria-label="Android Back"
                  className="flex items-center justify-center py-0.5 hover:text-slate-900"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={onSystemHome}
                  aria-label="Android Home"
                  className="flex items-center justify-center py-0.5 hover:text-slate-900"
                >
                  <Circle className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onSystemOverview || onSystemHome}
                  aria-label="Android Overview"
                  className="flex items-center justify-center py-0.5 hover:text-slate-900"
                >
                  <Square className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
