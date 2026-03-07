'use client';

import React, { useState } from 'react';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (content: string, format: 'csv' | 'json' | 'text', tripName: string) => Promise<void>;
  isLoading?: boolean;
}

export default function ImportDialog({
  isOpen,
  onClose,
  onImport,
  isLoading,
}: ImportDialogProps) {
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<'csv' | 'json' | 'text'>('csv');
  const [tripName, setTripName] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [step, setStep] = useState<'upload' | 'preview'>('upload');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
      setError('');

      // Auto-detect format from filename
      if (file.name.endsWith('.csv')) setFormat('csv');
      else if (file.name.endsWith('.json')) setFormat('json');
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handlePreview = async () => {
    if (!content.trim()) {
      setError('Please provide data to import');
      return;
    }

    try {
      setError('');
      const response = await fetch('/api/trips/import', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          format,
          tripName: tripName || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Preview failed');
      }

      const data = await response.json();
      setPreview(data.preview);
      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Failed to generate preview');
    }
  };

  const handleConfirmImport = async () => {
    try {
      setError('');
      await onImport(content, format, tripName || 'Imported Trip');
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Import failed');
    }
  };

  const handleClose = () => {
    setContent('');
    setFormat('csv');
    setTripName('');
    setError('');
    setPreview(null);
    setStep('upload');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg w-full max-w-2xl mx-4 shadow-xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {step === 'upload' ? 'Import Travel Data' : 'Preview Import'}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {step === 'upload' && (
            <>
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Data Format
                </label>
                <div className="flex gap-3">
                  {(['csv', 'json', 'text'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        format === fmt
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trip Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Trip Name (optional)
                </label>
                <input
                  type="text"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  placeholder="e.g., Summer Europe 2026"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* File Upload Area */}
              <div className="group">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Upload File or Paste Data
                </label>

                <div className="flex gap-3 mb-3">
                  <input
                    type="file"
                    accept=".csv,.json,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    className="flex-1 px-4 py-3 bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg text-center cursor-pointer hover:border-blue-500 hover:bg-slate-700 transition"
                  >
                    <p className="text-sm text-slate-400">
                      Click to select file or drag & drop
                    </p>
                  </label>
                </div>

                {/* Or divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-600"></div>
                  <span className="text-xs text-slate-500">OR</span>
                  <div className="flex-1 h-px bg-slate-600"></div>
                </div>

                {/* Paste area */}
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setError('');
                  }}
                  placeholder={
                    format === 'csv'
                      ? 'Paste CSV data (comma-separated columns)'
                      : format === 'json'
                        ? 'Paste JSON array or object'
                        : 'Paste text data (one entry per line)'
                  }
                  className="w-full h-64 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
              </div>

              {/* Format Help */}
              <div className="bg-slate-800 p-3 rounded-lg text-xs text-slate-400">
                <p className="font-medium text-slate-300 mb-2">Expected format:</p>
                {format === 'csv' && (
                  <p>
                    Headers in first row, comma-separated. Example:{' '}
                    <code>Title,Cost,Date,Location</code>
                  </p>
                )}
                {format === 'json' && (
                  <p>
                    JSON array of objects or single trip object. Each object should have{' '}
                    <code>title</code>, <code>cost</code>, <code>date</code> fields.
                  </p>
                )}
                {format === 'text' && (
                  <p>
                    One entry per line. Lines starting with -, *, or bullets will be treated as
                    separate entries.
                  </p>
                )}
              </div>
            </>
          )}

          {step === 'preview' && preview && (
            <div className="space-y-4">
              {/* Trip Info */}
              <div className="bg-slate-800 p-4 rounded-lg">
                <h3 className="font-semibold text-white mb-3">Trip Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-slate-400">Trip Name</p>
                    <p className="text-white">{preview.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Entries</p>
                    <p className="text-white">{preview.entriesCount}</p>
                  </div>
                  {preview.destination && (
                    <div>
                      <p className="text-slate-400">Destination</p>
                      <p className="text-white">{preview.destination}</p>
                    </div>
                  )}
                  {preview.fieldsCount > 0 && (
                    <div>
                      <p className="text-slate-400">Custom Fields</p>
                      <p className="text-white">{preview.fieldsCount}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sample Entries */}
              {preview.entries && preview.entries.length > 0 && (
                <div className="bg-slate-800 p-4 rounded-lg max-h-48 overflow-y-auto">
                  <h3 className="font-semibold text-white mb-3">Preview (first 5 entries)</h3>
                  <div className="space-y-2">
                    {preview.entries.map((entry: any, idx: number) => (
                      <div key={idx} className="text-sm border-l-2 border-blue-500 pl-3">
                        <p className="text-blue-400 font-medium">{entry.title}</p>
                        {entry.cost && (
                          <p className="text-slate-400">
                            Cost: ${entry.cost} {entry.currency}
                          </p>
                        )}
                        {entry.location && (
                          <p className="text-slate-400">Location: {entry.location}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detected Fields */}
              {preview.fields && preview.fields.length > 0 && (
                <div className="bg-slate-800 p-4 rounded-lg">
                  <h3 className="font-semibold text-white mb-3">Detected Field Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {preview.fields.map((field: any) => (
                      <span
                        key={field.key}
                        className="px-3 py-1 bg-slate-700 text-slate-200 rounded-full text-xs"
                      >
                        {field.key} ({field.type})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-700 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-medium transition"
          >
            Cancel
          </button>

          {step === 'upload' && (
            <button
              onClick={handlePreview}
              disabled={!content.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed font-medium transition"
            >
              {isLoading ? 'Loading...' : 'Preview'}
            </button>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-medium transition"
              >
                Back
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed font-medium transition"
              >
                {isLoading ? 'Importing...' : 'Import'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
