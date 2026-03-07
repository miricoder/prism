'use client';

import React, { useState } from 'react';

interface SessionConflictDialogProps {
  isOpen: boolean;
  existingSession: {
    browser: string;
    os: string;
    createdAt: string;
  };
  newDevice: {
    browser: string;
    os: string;
  };
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function SessionConflictDialog({
  isOpen,
  existingSession,
  newDevice,
  onConfirm,
  onCancel,
  isLoading,
}: SessionConflictDialogProps) {
  if (!isOpen) return null;

  const existingDate = new Date(existingSession.createdAt);
  const timeAgo = Math.round((Date.now() - existingDate.getTime()) / 1000 / 60);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg w-full max-w-md mx-4 shadow-xl border border-yellow-600 p-6 space-y-4">
        {/* Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">⚠️</div>
          <h2 className="text-xl font-semibold text-white">Session Conflict</h2>
        </div>

        {/* Message */}
        <p className="text-slate-300">
          You're already logged in from another browser or device. Signing in here will sign you out there.
        </p>

        {/* Device Info */}
        <div className="space-y-3 bg-slate-800 p-4 rounded-lg">
          <div>
            <p className="text-xs text-slate-400 mb-1">Current Session</p>
            <div className="text-sm text-slate-300">
              <p>{existingSession.browser} on {existingSession.os}</p>
              <p className="text-slate-500 text-xs mt-1">
                {timeAgo < 1 ? 'Just now' : `${timeAgo} minutes ago`}
              </p>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-3">
            <p className="text-xs text-slate-400 mb-1">New Login</p>
            <div className="text-sm text-slate-300">
              <p>{newDevice.browser} on {newDevice.os}</p>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3">
          <p className="text-xs text-blue-300">
            💡 <strong>Note:</strong> You can have one active session per device type. Desktop and mobile can be logged in simultaneously.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 disabled:cursor-not-allowed font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-yellow-700 disabled:cursor-not-allowed font-medium transition"
          >
            {isLoading ? 'Signing in...' : 'Sign In Anyway'}
          </button>
        </div>
      </div>
    </div>
  );
}
