import React from 'react';
import { useAppContext } from '../../store/AppContext';

export function DataTableTab() {
  const { state } = useAppContext();
  const { dataTable } = state;

  if (!dataTable || dataTable.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-slate-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-slate-400">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <h2 className="text-xl font-medium mb-2">No Data Loaded</h2>
        <p className="max-w-md text-center">Import a PCF, CSV, or Excel file using the buttons in the header to populate the Data Table.</p>
      </div>
    );
  }

  const renderFixingAction = (row) => {
    if (!row.fixingAction) return <span className="text-slate-400">—</span>;

    const tierColors = {
      1: { bg: "bg-green-50", text: "text-green-800", border: "border-green-500", label: "AUTO T1" },
      2: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-500", label: "FIX T2" },
      3: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-500", label: "REVIEW T3" },
      4: { bg: "bg-red-50", text: "text-red-800", border: "border-red-500", label: "ERROR T4" },
    };
    const colors = tierColors[row.fixingActionTier] || tierColors[3];

    return (
      <div className={`${colors.bg} ${colors.text} border-l-4 ${colors.border} p-2 font-mono text-xs leading-relaxed whitespace-pre-wrap rounded-r shadow-sm max-w-sm`}>
        <span className={`inline-block ${colors.border.replace('border-', 'bg-')} text-white px-1.5 py-0.5 rounded text-[10px] font-bold mb-1 mr-2`}>
          {colors.label}
        </span>
        <span className="font-semibold">{row.fixingActionRuleId}</span>
        <br />
        {row.fixingAction}
      </div>
    );
  };

  return (
    <div className="overflow-auto max-h-[calc(100vh-12rem)] border rounded shadow-sm bg-white">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 sticky top-0 shadow-sm z-10">
          <tr>
            {/* Identity */}
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap sticky left-0 bg-slate-100 border-r">Row</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap sticky left-[60px] bg-slate-100 border-r">Type</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Seq No</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Text</th>

            {/* Geometry */}
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap border-l">Bore</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">EP1 (x, y, z)</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">EP2 (x, y, z)</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">CP (x, y, z)</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">BP (x, y, z)</th>

            {/* Component specific */}
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap border-l">SKEY</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Support Coor</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Support Name</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Support GUID</th>

            {/* Attributes */}
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap border-l">CA Attributes</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">Ref No</th>

            {/* Actions */}
            <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap border-l min-w-[320px] sticky right-0 bg-slate-50">Smart Fix Preview</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {dataTable.map((row) => (
            <tr key={row._rowIndex} className={`group hover:bg-slate-50 transition-colors ${row._modified ? 'bg-cyan-50/30' : ''}`}>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-500 sticky left-0 bg-white border-r group-hover:bg-slate-50">{row._rowIndex}</td>
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-slate-900 sticky left-[60px] bg-white border-r group-hover:bg-slate-50">{row.type}</td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-500">{row.csvSeqNo || '—'}</td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-500 max-w-[200px] truncate" title={row.text}>{row.text || '—'}</td>

              <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-500 border-l">{row.bore}</td>
              <td className={`px-3 py-2 whitespace-nowrap text-sm font-mono text-slate-600 ${row._modified?.ep1 ? 'text-cyan-700 font-semibold' : ''}`}>
                {row.ep1 ? `${row.ep1.x.toFixed(1)}, ${row.ep1.y.toFixed(1)}, ${row.ep1.z.toFixed(1)}` : '—'}
              </td>
              <td className={`px-3 py-2 whitespace-nowrap text-sm font-mono text-slate-600 ${row._modified?.ep2 ? 'text-cyan-700 font-semibold' : ''}`}>
                {row.ep2 ? `${row.ep2.x.toFixed(1)}, ${row.ep2.y.toFixed(1)}, ${row.ep2.z.toFixed(1)}` : '—'}
              </td>
              <td className={`px-3 py-2 whitespace-nowrap text-sm font-mono text-slate-600 ${row._modified?.cp ? 'text-cyan-700 font-semibold' : ''}`}>
                {row.cp ? `${row.cp.x.toFixed(1)}, ${row.cp.y.toFixed(1)}, ${row.cp.z.toFixed(1)}` : '—'}
              </td>
              <td className={`px-3 py-2 whitespace-nowrap text-sm font-mono text-slate-600 ${row._modified?.bp ? 'text-cyan-700 font-semibold' : ''}`}>
                {row.bp ? `${row.bp.x.toFixed(1)}, ${row.bp.y.toFixed(1)}, ${row.bp.z.toFixed(1)}` : '—'}
              </td>

              <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-500 border-l">{row.skey || '—'}</td>
              <td className="px-3 py-2 whitespace-nowrap text-sm font-mono text-slate-600">
                {row.supportCoor ? `${row.supportCoor.x.toFixed(1)}, ${row.supportCoor.y.toFixed(1)}, ${row.supportCoor.z.toFixed(1)}` : '—'}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-500">{row.supportName || '—'}</td>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-500">{row.supportGuid || '—'}</td>

              <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-500 border-l">
                <div className="flex flex-wrap gap-1 max-w-[250px] overflow-hidden">
                  {Object.entries(row.ca || {}).filter(([_,v])=>v).map(([k,v]) => (
                    <span key={k} className="inline-block bg-slate-100 border border-slate-200 px-1 py-0.5 rounded text-[10px] text-slate-600">
                      <b>CA{k}:</b> {v}
                    </span>
                  ))}
                  {!row.ca || Object.keys(row.ca).length === 0 ? '—' : ''}
                </div>
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-sm font-mono text-slate-500">{row.refNo || '—'}</td>

              <td className="px-3 py-2 align-top border-l bg-white sticky right-0 group-hover:bg-slate-50">
                {renderFixingAction(row)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
