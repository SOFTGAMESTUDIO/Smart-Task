import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Database,
  Play,
  RotateCcw,
  Download,
  Copy,
  Check,
  Code2,
  Table as TableIcon,
  Layers,
  Clock,
  Sparkles,
  AlertCircle,
  FileCode,
  Info,
  ChevronRight,
  Search,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { apiClient } from '../services/apiClient';

const DEFAULT_QUERY = `SELECT id, title, category, priority, status, dueAt, estimatedMinutes
FROM tasks
WHERE status != 'cancelled'
ORDER BY CASE priority
  WHEN 'Critical' THEN 1
  WHEN 'High' THEN 2
  WHEN 'Medium' THEN 3
  ELSE 4
END
LIMIT 20;`;

export const QueryStudioPage = () => {
  const queryClient = useQueryClient();

  const [queryText, setQueryText] = useState(DEFAULT_QUERY);
  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'json'
  const [copied, setCopied] = useState(false);
  const [expandedTable, setExpandedTable] = useState('tasks');

  // Load Presets
  const { data: presets = [] } = useQuery({
    queryKey: ['query-presets'],
    queryFn: async () => {
      const res = await apiClient.getQueryPresets();
      return res.data || [];
    },
    staleTime: 60000,
  });

  // Load Schema
  const { data: schemaData } = useQuery({
    queryKey: ['query-schema'],
    queryFn: async () => {
      const res = await apiClient.getQuerySchema();
      return res.data || { tables: [] };
    },
    staleTime: 30000,
  });

  // Query Execution Mutation
  const queryMutation = useMutation({
    mutationFn: (sql) => apiClient.executeQuery(sql),
    onSuccess: (data) => {
      if (data?.data?.statementType === 'MUTATION') {
        // If data was modified, invalidate task and today queries
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['today-tasks'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
        queryClient.invalidateQueries({ queryKey: ['inbox-tasks'] });
        queryClient.invalidateQueries({ queryKey: ['query-schema'] });
      }
    },
  });

  // Run default query on initial mount
  useEffect(() => {
    queryMutation.mutate(DEFAULT_QUERY);
  }, []);

  const handleRunQuery = () => {
    if (!queryText.trim()) return;
    queryMutation.mutate(queryText.trim());
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRunQuery();
    }
  };

  const handleLoadPreset = (presetSql) => {
    setQueryText(presetSql);
    queryMutation.mutate(presetSql);
  };

  const handleInsertColumn = (columnName) => {
    setQueryText((prev) => `${prev.trim()} ${columnName}`);
  };

  const handleCopyJson = () => {
    if (!queryMutation.data?.data?.rows) return;
    navigator.clipboard.writeText(JSON.stringify(queryMutation.data.data.rows, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const data = queryMutation.data?.data;
    if (!data || !data.rows || data.rows.length === 0) return;

    const cols = data.columns;
    const csvRows = [cols.join(',')];

    for (const row of data.rows) {
      const values = cols.map((c) => {
        const val = row[c] === null || row[c] === undefined ? '' : String(row[c]);
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a);
  };

  const resultData = queryMutation.data?.data;
  const isPending = queryMutation.isPending;
  const error = queryMutation.error;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SQLite 3.x Local Database
            </span>
            <span className="text-xs text-slate-400 font-mono">./tasks.sqlite</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Database className="w-6 h-6 text-blue-400" />
            <span>SQL Query Studio</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Query and inspect your local task database with SQL. Zero latency, direct schema reflection, and instant export capabilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQueryText(DEFAULT_QUERY)}
            title="Reset to default query"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </Button>
          <Button
            size="sm"
            onClick={handleRunQuery}
            disabled={isPending || !queryText.trim()}
            className="shadow-lg shadow-blue-500/20"
          >
            <Play className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : 'fill-current'}`} />
            <span>{isPending ? 'Running...' : 'Run Query'}</span>
            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-blue-700/50 rounded text-blue-200">
              Ctrl + ↵
            </kbd>
          </Button>
        </div>
      </div>

      {/* Preset Queries Toolbar */}
      {presets.length > 0 && (
        <Card className="border-slate-800/80 bg-slate-900/60 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-thin">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap pl-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" /> Presets:
              </span>
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleLoadPreset(preset.sql)}
                  className="px-3 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-slate-700/60 transition-colors whitespace-nowrap font-medium text-xs flex items-center gap-1.5 group"
                  title={preset.description}
                >
                  <Code2 className="w-3 h-3 text-blue-400 group-hover:text-blue-300" />
                  <span>{preset.title}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Grid: Schema Browser + SQL Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Database Schema Explorer */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-slate-800/80 bg-slate-900/50">
            <CardHeader className="py-3 px-4 border-b border-slate-800/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Schema Explorer</span>
                </CardTitle>
                <span className="text-[10px] text-slate-400">
                  {schemaData?.tables?.length || 0} tables
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
              {schemaData?.tables?.map((table) => {
                const isExpanded = expandedTable === table.name;
                return (
                  <div
                    key={table.name}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedTable(isExpanded ? null : table.name)}
                      className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 font-mono font-medium text-slate-200">
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                        <span>{table.name}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {table.rowCount} rows
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-2 pt-1 border-t border-slate-800/50 space-y-1">
                        {table.columns.map((col) => (
                          <div
                            key={col.name}
                            onClick={() => handleInsertColumn(col.name)}
                            className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-800/80 cursor-pointer text-[11px] group transition-colors"
                            title={`Click to insert column "${col.name}" into query`}
                          >
                            <span className="font-mono text-slate-300 group-hover:text-blue-300 flex items-center gap-1.5">
                              {col.primaryKey && (
                                <span className="text-[9px] text-amber-400 font-bold">PK</span>
                              )}
                              {col.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {col.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick Syntax Tips */}
          <Card className="border-slate-800/80 bg-slate-900/30 text-xs">
            <CardContent className="p-3 text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 font-medium text-slate-300">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>Tips & Shortcuts</span>
              </div>
              <p className="text-[11px]">
                • Press <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-300">Ctrl+Enter</kbd> to execute query immediately.
              </p>
              <p className="text-[11px]">
                • Click column names on the left to quickly append them to your query.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: SQL Code Editor + Results */}
        <div className="lg:col-span-3 space-y-4">
          {/* Query Editor Box */}
          <Card className="border-slate-800/80 bg-slate-950/80 shadow-xl">
            <CardHeader className="py-2.5 px-4 border-b border-slate-800/80 bg-slate-900/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <span>SQL Query Editor</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="hidden sm:inline">Press Ctrl + Enter to run</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={7}
                placeholder="Write standard SQLite query here (SELECT, UPDATE, INSERT, DELETE)..."
                className="w-full bg-slate-950 p-4 font-mono text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-y leading-relaxed border-0"
                spellCheck="false"
              />
            </CardContent>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert variant="danger">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-xs">Query Execution Error</div>
                  <div className="text-xs mt-0.5 font-mono">{error.message}</div>
                </div>
              </div>
            </Alert>
          )}

          {/* Results Card */}
          <Card className="border-slate-800/80 bg-slate-900/60 shadow-xl overflow-hidden">
            <CardHeader className="py-2.5 px-4 border-b border-slate-800/80 bg-slate-900/80 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                  <TableIcon className="w-4 h-4 text-blue-400" />
                  <span>Results</span>
                </div>
                {resultData && (
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="primary" className="font-mono text-[10px]">
                      {resultData.rowCount} {resultData.rowCount === 1 ? 'row' : 'rows'}
                    </Badge>
                    <span className="text-slate-400 text-[11px] font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {resultData.executionTimeMs} ms
                    </span>
                    <Badge variant="default" className="text-[10px] font-mono">
                      {resultData.statementType}
                    </Badge>
                  </div>
                )}
              </div>

              {/* View switch & Export actions */}
              {resultData?.rows && resultData.rows.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex rounded-md bg-slate-800/80 p-0.5 border border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setActiveTab('table')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        activeTab === 'table'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Table
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('json')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        activeTab === 'json'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      JSON
                    </button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyJson}
                    className="h-7 px-2 text-xs gap-1"
                    title="Copy rows as JSON"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span className="hidden sm:inline">{copied ? 'Copied' : 'JSON'}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadCsv}
                    className="h-7 px-2 text-xs gap-1"
                    title="Download results as CSV"
                  >
                    <Download className="w-3 h-3" />
                    <span className="hidden sm:inline">CSV</span>
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {isPending ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs">Executing SQL query on local SQLite database...</p>
                </div>
              ) : !resultData ? (
                <div className="py-16 text-center text-slate-400 space-y-2">
                  <Database className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs">Run a query to view database records here</p>
                </div>
              ) : resultData.statementType === 'MUTATION' ? (
                <div className="p-6 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200">Execution Successful</h4>
                  <p className="text-xs text-slate-400">{resultData.message}</p>
                </div>
              ) : resultData.rows.length === 0 ? (
                <div className="py-16 text-center text-slate-400 space-y-1">
                  <Search className="w-7 h-7 text-slate-600 mx-auto mb-1" />
                  <p className="text-xs font-medium text-slate-300">0 records returned</p>
                  <p className="text-[11px] text-slate-400">The query completed successfully but matched no rows.</p>
                </div>
              ) : activeTab === 'json' ? (
                <div className="p-4 bg-slate-950 font-mono text-xs text-slate-200 max-h-[450px] overflow-auto">
                  <pre>{JSON.stringify(resultData.rows, null, 2)}</pre>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[450px] scrollbar-thin">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 backdrop-blur-sm z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center text-slate-400 font-mono">#</th>
                        {resultData.columns.map((col) => (
                          <th key={col} className="py-2.5 px-3 font-mono font-medium whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      {resultData.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2 px-3 text-center text-slate-400 text-[11px]">{idx + 1}</td>
                          {resultData.columns.map((col) => {
                            const val = row[col];
                            return (
                              <td key={col} className="py-2 px-3 whitespace-nowrap max-w-xs truncate">
                                {col === 'priority' ? (
                                  <Badge
                                    variant={
                                      val === 'Critical'
                                        ? 'danger'
                                        : val === 'High'
                                        ? 'warning'
                                        : val === 'Medium'
                                        ? 'primary'
                                        : 'default'
                                    }
                                    className="font-sans text-[10px]"
                                  >
                                    {val}
                                  </Badge>
                                ) : col === 'status' ? (
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-sans font-medium ${
                                      val === 'completed'
                                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                        : val === 'in_progress'
                                        ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                        : val === 'cancelled'
                                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                                    }`}
                                  >
                                    {val}
                                  </span>
                                ) : val === null || val === undefined ? (
                                  <span className="text-slate-400 italic">null</span>
                                ) : typeof val === 'object' ? (
                                  JSON.stringify(val)
                                ) : (
                                  String(val)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QueryStudioPage;
