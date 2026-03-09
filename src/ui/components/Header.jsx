import React, { useRef } from 'react';
import { useAppContext } from '../../store/AppContext';
import { parseExcelOrCSV, parsePCF } from '../../utils/ImportExport';

export function Header() {
  const { state, dispatch } = useAppContext();
  const excelInputRef = useRef(null);
  const pcfInputRef = useRef(null);

  const handleExcelClick = () => { if (excelInputRef.current) excelInputRef.current.click(); };
  const handlePcfClick = () => { if (pcfInputRef.current) pcfInputRef.current.click(); };

  const handleExcelChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const parsedData = await parseExcelOrCSV(file, state.config);
      dispatch({ type: "SET_DATA_TABLE", payload: parsedData });
      dispatch({ type: "ADD_LOG", payload: { type: "Info", message: `Successfully imported ${parsedData.length} rows from ${file.name}` }});
    } catch (err) {
      dispatch({ type: "ADD_LOG", payload: { type: "Error", message: `Failed to import file: ${err.message}` }});
      alert(`Error importing file: ${err.message}`);
    }
    e.target.value = null;
  };

  const handlePcfChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const parsedData = await parsePCF(file, state.config);
      dispatch({ type: "SET_DATA_TABLE", payload: parsedData });
      dispatch({ type: "ADD_LOG", payload: { type: "Info", message: `Successfully imported ${parsedData.length} rows from ${file.name}` }});
    } catch (err) {
      dispatch({ type: "ADD_LOG", payload: { type: "Error", message: `Failed to import file: ${err.message}` }});
      alert(`Error importing file: ${err.message}`);
    }
    e.target.value = null;
  };

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            PCF Validator & Smart Fixer
          </h1>
          <nav className="flex space-x-2">
            <button
              onClick={handlePcfClick}
              className="px-3 py-1.5 text-sm font-medium rounded hover:bg-slate-800 transition-colors flex items-center"
            >
              Import PCF ▼
            </button>
            <input
              type="file"
              accept=".pcf"
              ref={pcfInputRef}
              onChange={handlePcfChange}
              style={{ display: 'none' }}
            />
            <button
              onClick={handleExcelClick}
              className="px-3 py-1.5 text-sm font-medium rounded hover:bg-slate-800 transition-colors flex items-center"
            >
              Import Excel/CSV ▼
            </button>
            <input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              ref={excelInputRef}
              onChange={handleExcelChange}
              style={{ display: 'none' }}
            />
          </nav>
        </div>

        <div className="flex items-center space-x-4 text-sm text-slate-400">
          <span>Project: <span className="text-slate-200">Default</span></span>
          <div className="h-4 w-px bg-slate-700"></div>
          <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div> Online</span>
        </div>
      </div>
    </header>
  );
}
