import { useState } from 'react';
import { ExternalLink, Monitor, Smartphone, Tablet, RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const SERVER_URL = API_URL.replace(/\/api\/?$/, '');

type Device = 'desktop' | 'tablet' | 'mobile';

const deviceWidths: Record<Device, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

export function PreviewPage() {
  const [device, setDevice] = useState<Device>('desktop');
  const [key, setKey] = useState(0);

  const liveUrl = SERVER_URL || window.location.origin;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold text-gray-900">Live Preview</h1>

        <div className="flex items-center gap-3">
          {/* Device toggles */}
          <div className="flex rounded-md border border-gray-300">
            {([
              { id: 'desktop' as Device, icon: Monitor },
              { id: 'tablet' as Device, icon: Tablet },
              { id: 'mobile' as Device, icon: Smartphone },
            ]).map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setDevice(id)}
                className={`px-3 py-1.5 ${device === id ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          <button
            onClick={() => setKey((k) => k + 1)}
            className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>

          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            <ExternalLink className="h-4 w-4" /> Open Site
          </a>
        </div>
      </div>

      {/* iframe */}
      <div className="flex flex-1 items-start justify-center overflow-auto bg-gray-100 p-4">
        <iframe
          key={key}
          src={liveUrl}
          title="Live Site Preview"
          className="rounded-lg border border-gray-300 bg-white shadow-lg"
          style={{
            width: deviceWidths[device],
            maxWidth: '100%',
            height: device === 'desktop' ? '100%' : '80vh',
          }}
        />
      </div>
    </div>
  );
}
