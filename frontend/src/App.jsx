import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import axios from 'axios';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Search, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // <-- NEW IMPORT

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

const MAP_STYLE = MAPBOX_TOKEN
  ? 'mapbox://styles/mapbox/satellite-v9'
  : 'https://demotiles.maplibre.org/style.json';

export default function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  
  const [bbox, setBbox] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [ngrokUrl, setNgrokUrl] = useState('http://localhost:8000');
  const [mapStatus, setMapStatus] = useState(
    MAPBOX_TOKEN
      ? 'Map ready'
      : 'Mapbox token missing; using public demo map style.'
  );

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    try {
      map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_TOKEN ? 'mapbox://styles/mapbox/satellite-streets-v9' : MAP_STYLE, 
      center: [78.9629, 20.5937],
      zoom: 5,
      pitch: 40, 
      projection: 'globe' 
    });
    
    map.current.on('style.load', () => {
      map.current.setFog({}); 
    });

      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true }
      });
      
      map.current.addControl(draw.current);
      map.current.on('draw.create', updateBbox);
      map.current.on('draw.update', updateBbox);
      map.current.on('draw.delete', () => setBbox(''));
      setMapStatus('Map ready');
    } catch (error) {
      console.error('Map initialization failed:', error);
      setMapStatus('Map failed to initialize. Check your Mapbox token and network access.');
    }
  }, []);

  const updateBbox = () => {
    const data = draw.current.getAll();
    if (data.features.length > 0) {
      const coords = data.features[0].geometry.coordinates[0];
      const lngs = coords.map(c => c[0]);
      const lats = coords.map(c => c[1]);
      setBbox(`${Math.min(...lngs)},${Math.min(...lats)},${Math.max(...lngs)},${Math.max(...lats)}`);
    }
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const backendUrl = ngrokUrl.trim().replace(/\/+$/, '');
    if (!backendUrl) {
      setResult({ error: 'Backend URL is required. Use http://localhost:8000 or your tunnel URL.' });
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('bbox', bbox);
    formData.append('date_range', '2025-01-01T00:00:00Z/2026-09-17T23:59:59Z');
    formData.append('query', query);

    try {
      const response = await axios.post(`${backendUrl}/api/v1/query`, formData, {
        headers: { "ngrok-skip-browser-warning": "69420" }
      });
      setResult(response.data);
    } catch (err) {
      console.error('Query failed:', err);
      const message = err?.response?.data?.detail || 'Failed to reach backend server. Verify the backend URL.';
      setResult({ error: message });
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      <div className="w-1/3 p-6 flex flex-col gap-5 shadow-2xl z-10 bg-gray-800 overflow-y-auto">
        <div>
          <h1 className="text-3xl font-bold text-blue-400 tracking-tight">SatQuery AI</h1>
          <p className="text-sm text-gray-400 mt-1">SIH Prototype: Natural Language Satellite Query Engine</p>
        </div>

        <div className="bg-gray-700/50 p-3 rounded-md border border-gray-600">
          <label className="text-xs text-gray-400 uppercase font-semibold">Backend URL</label>
          <input 
            type="text" 
            value={ngrokUrl} 
            onChange={(e) => setNgrokUrl(e.target.value)} 
            className="w-full p-2 bg-gray-900 border border-gray-600 rounded mt-1 text-xs text-green-400 font-mono" 
            placeholder="http://localhost:8000 or https://xxxx.ngrok-free.app" 
          />
        </div>

        <div className="bg-gray-800/80 border border-gray-700 rounded-md px-3 py-2 text-xs text-gray-300">
          {mapStatus}
        </div>

        <form onSubmit={handleQuery} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-400 uppercase font-semibold">Selected Bounding Box</label>
            <input type="text" readOnly value={bbox} className="w-full p-2 bg-gray-700 rounded mt-1 text-sm outline-none font-mono text-gray-300" placeholder="Draw a bounding polygon on map..." />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase font-semibold">Natural Language Query</label>
            <textarea value={query} onChange={(e) => setQuery(e.target.value)} rows="3" className="w-full p-2 bg-gray-700 rounded mt-1 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Identify urban density expansion near this water body..." />
          </div>
          
          <button type="submit" disabled={!bbox || !query || !ngrokUrl || loading} className="bg-blue-600 hover:bg-blue-500 p-3 rounded font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
            {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />} Analyze Imagery
          </button>
        </form>

        {result && (
          <div className="mt-2 p-4 bg-gray-700 rounded-lg border border-gray-500 shadow-inner">
            <h3 className="text-xs text-blue-300 uppercase font-bold mb-2">VLM Analysis Output</h3>
            {result.error ? (
              <p className="text-red-400 text-sm">{result.error}</p>
            ) : (
              <>
                {/* --- NEW: Markdown Rendering Block --- */}
                <ReactMarkdown className="prose prose-invert prose-sm text-gray-300 max-w-none leading-relaxed">
                  {result.evidence_grounded_answer}
                </ReactMarkdown>
                {/* ------------------------------------- */}
                
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-600">
                  <span className="text-[10px] bg-blue-900/50 text-blue-300 px-2 py-1 rounded border border-blue-700">Model: {result.model_used}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <div ref={mapContainer} className="w-2/3 h-full" />
    </div>
  );
}